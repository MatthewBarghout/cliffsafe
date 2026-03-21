import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

export const calculateCliff = (payload) => api.post("/calculate", payload);
export const getBenefits = (state, householdSize) =>
  api.get(`/benefits/${state}/${householdSize}`);
export const optimizeIncome = (payload) => api.post("/optimize", payload);

export default api;
