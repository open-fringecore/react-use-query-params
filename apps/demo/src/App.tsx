import {useQueryParams} from 'react-use-query-params';

function MainForm() {
    const [params, setParams] = useQueryParams<{
        tomato: string;
    }>();

    console.log(Object.entries(params));

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
