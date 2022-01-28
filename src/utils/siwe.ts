import { DEFAULT_TTL } from "../constants";
import { extractHostname, getBrowserUrl, listObject } from "./misc";

export function formatAuthMessage(
  address: string,
  chainId: number,
  ttl = DEFAULT_TTL
) {
  const url = getBrowserUrl();

  const now = Date.now();
  const exp = now + ttl;
  const domain = extractHostname(url);

  const params = {
    URI: url,
    Version: 1,
    Nonce: now,
    "Issued At": new Date(now).toISOString(),
    "Expiration Time": new Date(exp).toISOString(),
    "Chain ID": chainId,
  };

  const lines = [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    "",
    ...listObject(params),
  ];

  const message = lines.join("\n");

  return message;
}
