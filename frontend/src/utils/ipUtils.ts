/**
 * Converts an IP address string to a number for comparison
 */
export function ipToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    throw new Error("Invalid IP address format");
  }
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

/**
 * Parses a CIDR range (e.g., "172.18.0.0/16") and returns network address and mask
 */
export function parseCIDR(
  cidr: string
): { network: number; mask: number } | null {
  const parts = cidr.split("/");
  if (parts.length !== 2) return null;

  const ip = parts[0].trim();
  const prefixLength = parseInt(parts[1].trim(), 10);

  if (isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32) {
    return null;
  }

  try {
    const network = ipToNumber(ip);
    const mask = 0xffffffff << (32 - prefixLength);
    return { network: network & mask, mask };
  } catch {
    return null;
  }
}

/**
 * Checks if an IP address falls within a CIDR range or matches an exact IP
 */
export function isIPInRange(ip: string, range: string): boolean {
  // Check if range is a CIDR notation
  if (range.includes("/")) {
    const cidr = parseCIDR(range);
    if (!cidr) return false;

    try {
      const ipNum = ipToNumber(ip);
      return (ipNum & cidr.mask) === cidr.network;
    } catch {
      return false;
    }
  } else {
    // Exact IP match
    return ip === range;
  }
}

/**
 * Checks if deleting the specified IP/CIDR would affect the current session
 */
export function wouldBlockCurrentSession(
  ipToDelete: string,
  currentIP: string | null | undefined
): boolean {
  if (!currentIP) return false;
  return isIPInRange(currentIP, ipToDelete);
}
