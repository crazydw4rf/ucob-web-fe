import { API_URL } from "./constants";
import { Axios } from "axios";

class ApiWrapper<T = any> {
  #endpoint;
  #axios;

  constructor(endpoint: string) {
    this.#axios = new Axios({
      baseURL: API_URL,
      timeout: 5000,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      withCredentials: true,
    });

    this.#endpoint = endpoint;
  }

  async getRequest() {
    return await this.#axios.get<T>(this.#endpoint);
  }

  async postRequest(payload: object) {
    return await this.#axios.post<T>(this.#endpoint, JSON.stringify(payload));
  }
}

/**
 * @param {string} endpoint contoh endpoint "/users/1"
 */
export function ApiRequest<T = any>(endpoint: string): ApiWrapper<T> {
  return new ApiWrapper(endpoint);
}

export default ApiRequest;
