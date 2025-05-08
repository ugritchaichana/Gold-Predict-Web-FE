import { useQuery } from '@tanstack/react-query';

const goldTH_URL = 'https://gold-predictions.duckdns.org/finnomenaGold/get-gold-data/?db_choice=0&frame=all&display=chart2&cache=True';



const useGoldData = () => {
    return useQuery(['goldData'], async () => {
        // Simulate a network request with a delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Fetch data from the API
        const response = await fetch(goldTH_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
};

const useChartData = () => {
    const { data, isLoading, isError, error } = useGoldData();

    if (isLoading) {
        return { data: [], isLoading, isError, error };
    }

    if (isError) {
        return { data: [], isLoading, isError, error };
    }
    console.log('✅useChartData -> ', { data: data, isLoading, isError, error });

    return { data: data, isLoading, isError, error };
    // return { data: processedData, isLoading, isError, error };
}

export { useChartData };