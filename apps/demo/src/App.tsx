import useQueryParams from 'react-use-query-params';
// import {useEffect} from 'react';

function MainForm() {
    const [params, setParams] = useQueryParams<{
        tomato: string;
    }>();

    console.log('re-rendered', Object.keys(params));

    return (
        <button
            onClick={() => {
                setParams((params) => {
                    return {...params, potato: 'huehue'};
                });
            }}>
            Tomato {JSON.stringify(params.tomato)}
        </button>
    );
}

function App() {
    return <MainForm />;
}

export default App;
