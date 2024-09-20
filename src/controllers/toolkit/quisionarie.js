const quisionarieTools = () => new DynamicStructuredTool({
    name: "Quisioner",
    description: "Panggil tool ini untuk mengisi kuisioner jika data percakapan sudah lengkap dan memenuhi semua kriteria untuk mengisi schema",
    schema: z.object({
        year: z.string().describe("Tahun sesuai dengan input user, jika tidak ada gunakan tools get_this_year untuk mendapatkan tahun ini"),
        month: z.string().describe("Bulan sesuai dengan input user, jika tidak ada gunakan tools get_this_month untuk mendapatkan bulan ini"),
        branch: z.array(z.enum(["GM1", "GM2", "GK", "CNJ2", "CVA", "CLN", "CBA", "CVC"])).default([]).describe("Branch atau factory")
    }),
    func: async ({ month, year, branch }) => {
        try{
            console.log('Tools Info Plan Income:', month, year, branch);
            const response = await axios.post(`${process.env.GCC_API_URL}/api/elc/planincome`, { year, month, branch })
            if(response.data.data.length > 0){
                return JSON.stringify(response.data)
            }else{
                return "Tidak ada data plan income."
            }
        } catch(error){
            console.log("error mendapatkan data plan income dari api", error)
            return `Gagal mengambil Informasi Plan Income dari API`
        }
    },
});
