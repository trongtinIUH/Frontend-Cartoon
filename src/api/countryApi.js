import axios from 'axios';

const COUNTRY_API_URL = "https://www.apicountries.com/countries";

export const getCountries = async () => {
  try {
    console.log("🌍 Fetching countries from apicountries.com...");
    
    const response = await axios.get(COUNTRY_API_URL, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    // Kiểm tra response có hợp lệ không
    if (!Array.isArray(response.data)) {
      console.error("❌ API data is not an array:", typeof response.data);
      throw new Error("Invalid data format from API");
    }

    console.log("✅ Successfully fetched", response.data.length, "countries");
    
    // Chỉ lấy name và sort
    const countries = response.data
      .map(country => country.name)
      .filter(name => name && typeof name === 'string') // Đảm bảo name hợp lệ
      .sort();

    console.log("🌍 Processed countries:", countries.length);
    return countries;

  } catch (error) {
    console.error("❌ Error fetching countries:", error.message);
    
    // Trả về danh sách countries dự phòng
    console.log("🔄 Using fallback countries list");
    return getFallbackCountries();
  }
};

export const getFallbackCountries = () => {
  return [
    "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia",
    "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium",
    "Bolivia", "Brazil", "Bulgaria", "Cambodia", "Canada", "Chile", "China",
    "Colombia", "Croatia", "Czech Republic", "Denmark", "Egypt", "Estonia",
    "Finland", "France", "Georgia", "Germany", "Greece", "Hong Kong", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
    "Italy", "Japan", "Jordan", "Kazakhstan", "Kuwait", "Latvia", "Lebanon",
    "Lithuania", "Luxembourg", "Malaysia", "Mexico", "Netherlands", "New Zealand",
    "Norway", "Pakistan", "Philippines", "Poland", "Portugal", "Qatar",
    "Romania", "Russia", "Saudi Arabia", "Singapore", "Slovakia", "Slovenia",
    "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Taiwan",
    "Thailand", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom",
    "United States", "Vietnam"
  ].sort();
};