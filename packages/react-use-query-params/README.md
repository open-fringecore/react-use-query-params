# react-use-query-params

[![npm version](https://shields.io/npm/v/react-use-query-params.svg)](https://www.npmjs.com/package/react-use-query-params)
[![npm downloads](https://shields.io/npm/dm/react-use-query-params.svg)](https://www.npmjs.com/package/react-use-query-params)
[![license](https://shields.io/npm/l/react-use-query-params.svg)](https://www.npmjs.com/package/react-use-query-params)

> Strongly typed, routing-library agnostic react hook to use and manipulate query params.

## Features

1. Strongly Typed
2. Uses Browser's [DOM History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
3. [Functional Updates](https://legacy.reactjs.org/docs/hooks-reference.html#functional-updates)
4. Re-renders only when the params you accessed changes.

## Installation

```bash
# npm
npm install --save react-use-query-params

# pnpm
pnpm add react-use-query-params
```

## Usage

## Basic
Behaves very similar to React's `useState`

```tsx
import useQueryParams from "react-use-query-params";

function App() {
    const [params, setParams] = useQueryParams();
    
    const clickHandler = () => {
        setParams({
            tomato: 'RED'
        });
    };
    
    return (
        <>
            <div>
                {params.tomato.length // parameters are always arrays of strings
                    ? params.tomato[0]
                    : null}
            </div>
            
            <button onClick={clickHandler}>Update</button>
        </>
    );
}
```

## Type Safety

If you don't want to accidentally access the wrong query param key, you can
pass an object as the first generic type argument.

```tsx
interface QueryParams {
    tomato: string;
    potato: string;
}

const [params, setParams] = useQueryParams<QueryParams>();

params.tomato; // ok
params.potato; // ok
params.mango;  // Type Error
```

## Multiple Values

You can send a string array in any key to `setParams`

```tsx
setParams({
    tomato: ['RED', 'ROUND']
});
```

## Replace State

Sending `true` as the second argument to `setParams` will use `.replaceState()` 
instead of `.pushState()`

```tsx
setParams({
    tomato: 'RED'
}, true);
```

## Functional Updates (for Partial Updates)

Similar to React's `useState`, you can pass a function to `setParams`.

```tsx
const [params, setParams] = useQueryParams<QueryParams>();

setParams((params) => {
    return {
        ...params,
        tomato: 'GREEN'
    };
});
```

## Behaviour

The `params` object is actually a proxy that tracks which query params the rest of your code
is interested in. This allows the library to only trigger re-renders those parameters change.

The proxy also accounts for iteration (`for (const key in params) { ... }`,
`Object.keys(params)`, `Object.values(params)`, etc). That means when you iterate
over the available keys, if a new query param is added, the component will re-render.
The same is true if the query param is removed even if you didn't access the param's value.

## License

MIT
