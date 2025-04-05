import axios from 'axios';

const API_URL = 'https://jsonplaceholder.typicode.com'; 

export const getData = async () => {
  try {
    const response = await axios.get(`${API_URL}/posts`);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export const postData = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/posts`, data);
    return response.data;
  } catch (error) {
    console.error("Error posting data:", error);
    throw error;
  }
};