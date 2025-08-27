// lib/rules.ts

export const RULE_KB = {
	supportNumber: "+1-800-555-1212",
	supportEmail: "support@example.com",
	hours: "Mon-Fri 9am-5pm ET",
	helpCenterUrl: "https://example.com/help",
	statusUrl: "https://status.example.com",
	pricingUrl: "https://example.com/pricing",
};

// Very small deterministic rule matcher for common support queries
export function ruleAnswer(q: string): string | null {
	const s = q.toLowerCase();
	if (s.includes("phone") || s.includes("contact number") || s.includes("call")) {
		return `You can call us at ${RULE_KB.supportNumber}.`;
	}
	if (s.includes("email") || s.includes("support email")) {
		return `Support email: ${RULE_KB.supportEmail}`;
	}
	if (s.includes("hours") || s.includes("open") || s.includes("close")) {
		return `Support hours: ${RULE_KB.hours}`;
	}
	if (s.includes("pricing")) {
		return `Our pricing is available at ${RULE_KB.pricingUrl}`;
	}
	if (s.includes("status") || s.includes("uptime")) {
		return `Check system status at ${RULE_KB.statusUrl}`;
	}
	return null;
}
