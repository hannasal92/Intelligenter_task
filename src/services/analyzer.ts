import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const VT_API_KEY = process.env.VT_API_KEY;
const WHOIS_API_KEY = process.env.WHOIS_API_KEY;

export async function fetchVirusTotal(domain: string) {
  //If the VT_API_KEY environment variable is missing, it returns dummy data.
  if (!VT_API_KEY) {
    return { numberOfDetection: 0, numberOfScanners: 0, detectedEngines: {}, raw: null, lastUpdated: new Date() };
  }
  // if we want a real data we can send request by using axios (GET) to https://www.virustotal.com/api/v3/domains/${domain} , { headers: { "x-apikey": VT_API_KEY }}
  /*
  // const res = await axios.get(`https://www.virustotal.com/api/v3/domains/${domain}`, { 
  //   headers: { "x-apikey": VT_API_KEY }
  // });
  // parse res.data...
  */
  return { numberOfDetection: 0, numberOfScanners: 70, detectedEngines: { "CLEAN MX": true }, lastUpdated: new Date(), raw: null };
}

export async function fetchWhois(domain: string) {
  // If we don’t provide a real WHOIS API key in .env, the function returns stub data .
  if (!WHOIS_API_KEY) {
    return { dateCreated: new Date("1997-09-15"), ownerName: "WhoisStub Ltd", expiredOn: new Date("2028-09-13"), raw: null };
  }
  // Real implementation: call WHOIS provider and parse.
  return { dateCreated: new Date("1997-09-15"), ownerName: "WhoisStub Ltd", expiredOn: new Date("2028-09-13"), raw: null };
}

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

//Real implementation for whois
/*
  try {
    const { data } = await axios.get(
      `https://www.whoisxmlapi.com/whoisserver/WhoisService`,
      {
        params: {
          domainName: domain,
          outputFormat: 'JSON',
          apiKey: WHOIS_API_KEY,
        },
      }
    );

    const whoisRecord = data.WhoisRecord;

    return {
      dateCreated: new Date(whoisRecord.createdDate || '1997-09-15'),
      ownerName: whoisRecord.registrant ? whoisRecord.registrant.name : 'Unknown',
      expiredOn: new Date(whoisRecord.expiresDate || '2028-09-13'),
      raw: whoisRecord,
    };
  } catch (error) {
    console.error('Error fetching WHOIS data:', error);
    return {
      dateCreated: new Date('1997-09-15'),
      ownerName: 'WhoisStub Ltd',
      expiredOn: new Date('2028-09-13'),
      raw: null,
    };
  }
*/