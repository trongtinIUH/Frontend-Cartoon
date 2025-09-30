import axiosInstance from "../api/axiosInstance";

const API_BASE_URL = 'http://localhost:8080/pricing';

const PricingService = {
    // get all price list
    getAllPriceList: async () => {
        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/all-price-lists`);
            return response.data;
        } catch (error) {
            console.error('Error fetching price list:', error);
            throw error;
        }
    },
    // create price list
    createPriceList: async (priceListData) => {
        try {
            const response = await axiosInstance.post(`${API_BASE_URL}/create-price-list`, priceListData);
            return response.data;
        } catch (error) {
            console.error('Error creating price list:', error);
            throw error;
        }
    },
    // update end date of price list
    updatePriceListEndDate: async (priceListId, newEndDate, carryForwardMissing = false) => {
        try {
            const body = { newEndDate, carryForwardMissing };
            const res = await axiosInstance.patch(`${API_BASE_URL}/price-lists/${priceListId}/extend`, body);
            return res.data;
        } catch (error) {
            console.error('Error updating price list end date:', error);
            throw error;
        }
    },
    // create items for price list
    addPriceItem: async (priceItemData) => {
        try {
            const response = await axiosInstance.post(`${API_BASE_URL}/price-items`, priceItemData);
            return response.data;
        } catch (error) {
            console.error('Error creating price list items:', error);
            throw error;
        }
    },
    // get items by price list id
    getPriceListItems: async (priceListId) => {
        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/price-items/${priceListId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching price list items:', error);
            throw error;
        }
    },
    // update effectiveEndDate of price list
    updateEffectiveEndDate: async (priceListId, packageId, newEndDate) => {
        return axiosInstance.put(
            `${API_BASE_URL}/update-effective-end-date`,
            {},
            { params: { priceListId, packageId, newEndDate } }
        );
    }
};

export default PricingService;
