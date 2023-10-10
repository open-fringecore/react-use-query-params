import {useCallback, useEffect, useMemo, useReducer, useRef} from 'react';

const listeners = new Set<() => void>();

function runListeners() {
    listeners.forEach((listener) => {
        listener();
    });
}

(function (history) {
    function intercept(func: any) {
        return function (...args: any[]) {
            const returnedValue = func.apply(history, args);
            runListeners();

            return returnedValue;
        };
    }

    history.pushState = intercept(history.pushState);
    history.replaceState = intercept(history.replaceState);

    // to handle browser's native backward and forward functionality
    window.addEventListener('popstate', () => {
        runListeners();
    });
})(window.history);

// Exactly the same as Array<string> but with a custom toString
// method that always returns the first value
export class ParamValuesArray extends Array<string> {
    toString() {
        if (this.length > 0) {
            return `${this[0]}`;
        }

        return '';
    }
}

export type DefaultParamsObject = Record<string, any>;

export type AllParams<PARAMS extends DefaultParamsObject> = Partial<
    Record<keyof PARAMS, ParamValuesArray>
>;

// string or string[] with single value for properties
// defined as just `string` string[] for properties defined as `string[]`
export type InputParams<PARAMS extends DefaultParamsObject> = Partial<{
    [KEY in keyof PARAMS]: PARAMS[KEY] extends string[]
        ? string[]
        : [string] | string;
}>;

export function appendQueryParamsToURL<PARAMS extends DefaultParamsObject>(
    url: URL,
    queryParams: InputParams<PARAMS>,
) {
    for (const [key, values] of Object.entries(queryParams)) {
        const usableValues = Array.isArray(values) ? values : [values];
        url.searchParams.delete(key);

        for (const value of usableValues) {
            url.searchParams.append(key, value);
        }
    }
}

export function makeLocation<
    PARAMS extends DefaultParamsObject = DefaultParamsObject,
>(url: string, queryParams: InputParams<PARAMS> = {}) {
    const isFullURL = url.includes('http://') || url.includes('https://');
    const isAbsolute = !isFullURL && url.startsWith('/');

    const nextURL = (() => {
        if (isFullURL) {
            return new URL(url);
        } else {
            const nextURL = new URL(window.location.href);

            if (isAbsolute) {
                const [pathname, query] = url.split('?');

                nextURL.pathname = pathname;
                nextURL.search = query ?? '';
            } else {
                const [pathname, query] = url.split('?');

                const urlSegments = nextURL.pathname.split('/');

                nextURL.pathname = [
                    ...urlSegments.slice(0, -1),
                    pathname.trim()
                        ? pathname
                        : urlSegments[urlSegments.length - 1],
                ].join('/');

                nextURL.search = query ?? '';
            }

            return nextURL;
        }
    })();

    appendQueryParamsToURL(nextURL, queryParams);

    return nextURL;
}

export function useQueryParams<
    PARAMS extends DefaultParamsObject = DefaultParamsObject,
>() {
    const currentLocation = window.location.href;

    const urlSearchParams = useMemo(() => {
        return new URLSearchParams(window.location.search);
    }, [currentLocation]);

    const watching = useRef<{
        [key in keyof PARAMS]?: string[];
    }>({});

    // stores both the key and the values as an array
    // of the params that are being watched
    const watch = useCallback(
        (key: keyof PARAMS) => {
            if (key in watching.current) {
                return;
            }

            const values = urlSearchParams.getAll(String(key));
            watching.current[key] = values;
        },
        [urlSearchParams, watching],
    );

    const clearWatch = useCallback(() => {
        watching.current = {};
    }, [watching]);

    // React's officially recommended way of forcing a rerender
    const [, rerender] = useReducer((state) => state + 1, 0);

    const handle = useCallback(() => {
        const currentParams = new URLSearchParams(window.location.search);

        let shouldRerender = false;

        for (const [key, values] of Object.entries(watching.current)) {
            const currentValues = currentParams.getAll(key);

            if (currentValues.length !== values?.length) {
                shouldRerender = true;
                break;
            }

            // the first mismatched value means we need to rerender
            for (let i = 0; i < currentValues.length; i++) {
                if (currentValues[i] !== values[i]) {
                    shouldRerender = true;
                    break;
                }
            }
        }

        if (shouldRerender) {
            clearWatch();
            rerender();
        }
    }, [watching, clearWatch, rerender]);

    useEffect(() => {
        // listening on the global window object
        // via interceptions and listeners.
        listeners.add(handle);

        return () => {
            listeners.delete(handle);
        };
    }, [handle]);

    const getParam = <KEY extends keyof PARAMS>(
        paramKey: PARAMS[KEY] extends string ? KEY : never,
    ): string | undefined => {
        watch(paramKey);
        return urlSearchParams.get(String(paramKey)) ?? undefined;
    };

    const getParams = <KEY extends keyof PARAMS>(
        paramKey: PARAMS[KEY] extends string[] ? KEY : never,
    ): string[] => {
        watch(paramKey);
        return urlSearchParams.getAll(String(paramKey));
    };

    const hasParam = (paramKey: keyof PARAMS): boolean => {
        watch(paramKey);
        return urlSearchParams.has(String(paramKey));
    };

    const setLocation = (
        url: string | URL,
        queryParams: InputParams<PARAMS> = {},
        replace: boolean = false,
    ) => {
        const nextURL =
            url instanceof URL ? url : makeLocation(url, queryParams);

        const sameOrigin =
            nextURL.host === window.location.host &&
            nextURL.protocol === window.location.protocol;

        // History API only supports same origin URLs
        if (sameOrigin) {
            if (replace) {
                window.history.replaceState(null, '', nextURL.href);
            } else {
                window.history.pushState(null, '', nextURL.href);
            }
        } else {
            window.location.href = nextURL.href;
        }
    };

    const mergeParams = (
        queryParams: InputParams<PARAMS>,
        replace: boolean = false,
    ) => {
        // merging is the default behaviour of the setLocation
        setLocation(window.location.href, queryParams, replace);
    };

    const setParams = (
        queryParams: InputParams<PARAMS>,
        replace: boolean = false,
    ) => {
        const url = new URL(window.location.href);

        // must clear the search params first as
        // expected behaviour is replacement
        url.search = '';

        setLocation(url.href, queryParams, replace);
    };

    const removeParams = (
        paramKeys:
            | keyof PARAMS
            | (keyof PARAMS)[]
            | Partial<{
                  [key in keyof PARAMS]: boolean;
              }>,
        replace: boolean = false,
    ) => {
        const url = new URL(window.location.href);

        const usableKeys = Array.isArray(paramKeys)
            ? paramKeys
            : paramKeys instanceof Object
            ? Object.entries(paramKeys)
                  .filter(([, value]) => value)
                  .map(([key]) => key)
            : [paramKeys];

        for (const key of usableKeys) {
            url.searchParams.delete(key as string);
        }

        setLocation(url, {}, replace);
    };

    return {
        location: currentLocation,
        getParam: getParam,
        getParams: getParams,
        hasParam: hasParam,
        setLocation: setLocation,
        makeLocation: (url: string, queryParams: InputParams<PARAMS>) =>
            makeLocation(url, queryParams),
        mergeParams: mergeParams,
        setParams: setParams,
        removeParam: removeParams,
        removeParams: removeParams,
        get allParams() {
            const allParams: AllParams<PARAMS> = {};

            for (const [key] of urlSearchParams.entries()) {
                // this will watch all the params.
                watch(key);

                allParams[key as keyof PARAMS] = ParamValuesArray.from(
                    urlSearchParams.getAll(String(key)),
                );
            }

            return allParams;
        },
    };
}
