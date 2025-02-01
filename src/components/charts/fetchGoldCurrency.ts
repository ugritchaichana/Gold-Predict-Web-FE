// ในไฟล์ fetchGoldCurrency.ts
export async function fetchGoldData(startTimeframe: string, endTimeframe: string, dbChoice: number): Promise<GoldData[]> {
    const url = `${import.meta.env.VITE_GOLD_TH}&startTimeframe=${startTimeframe}&endTimeframe=${endTimeframe}&db_choice=${dbChoice}`;
    console.log(url);
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data && data.data) {
            let filteredData = data.data.map((item: any) => ({
                date: item.date,
                price: parseFloat(item.price),
            }));

            // สำหรับ ALL ให้กรองข้อมูลแบบหยาบ (ทุก 3 วัน หรือ 2 วัน)
            if (startTimeframe === '' && endTimeframe !== dayjs().format('DD-MM-YYYY')) {
                // กรองให้แสดงข้อมูลทุก 3 วัน
                filteredData = filteredData.filter((_, index) => index % 3 === 0); // ทุก 3 วัน
            }

            return filteredData;
        } else {
            throw new Error('No data found');
        }
    } catch (error) {
        console.error('Error fetching gold data:', error);
        throw error;
    }
}
