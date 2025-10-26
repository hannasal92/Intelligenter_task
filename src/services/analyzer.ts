import axios from "axios";
import axiosRetry from "axios-retry";
import dotenv from "dotenv";
dotenv.config();

const VT_API_KEY = process.env.VT_API_KEY;
const WHOIS_API_KEY = process.env.WHOIS_API_KEY;
const WHOIS_URL = process.env.WHOIS_URL;
const VT_URL = process.env.VT_URL;

axiosRetry(axios, {
  retries: 5, // maximum retry attempts
  retryDelay: (retryCount) => retryCount * 500, // exponential delay
  retryCondition: (error : any) => {
    // retry on network errors or 5xx/429 status codes
    return (
      axiosRetry.isNetworkError(error) ||
      axiosRetry.isRetryableError(error) ||
      [429, 500, 502, 503, 504].includes(error?.response?.status)
    );
  },
});


export async function analyzeDomain(domain: string) {
  const [vtData, whoisData] = await Promise.all([
    fetchVirusTotal(domain),
    fetchWhois(domain)
  ]);

  return {
    domain,
    vtData,
    whoisData,
    lastUpdated: new Date(),
    nextCheck: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days later
  };
}
async function fetchWhois(domain : string) {
  if (!VT_API_KEY) {
    return {};
  }
  const { data } = await axios.get(
    `${WHOIS_URL}`,
    {
      headers: {
        Authorization: `Bearer ${WHOIS_API_KEY}`,
      },
      params: {
        domainName: domain,
        outputFormat: "JSON",
      },
      timeout: 5000,
    }
  );

  return data;
}

export async function fetchVirusTotal(domain: string) {
  // if (!VT_API_KEY) {
  //   return { numberOfDetection: 0, numberOfScanners: 0, detectedEngines: {}, raw: null, lastUpdated: new Date() };
  // }

  const { data } = await axios.get(
    `${VT_URL}/${domain}`,
    {
      headers: {
        "x-apikey": VT_API_KEY,
      },
      timeout: 5000,
    }
  );

  return data;
}