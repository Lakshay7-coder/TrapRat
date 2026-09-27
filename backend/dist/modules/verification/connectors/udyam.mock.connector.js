"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.udyamMockConnector = exports.UdyamMockConnector = void 0;
class UdyamMockConnector {
    name = 'UDYAM_MSME_SIGNAL_CONNECTOR';
    async check(input) {
        if (!input.consentedPurposes.includes('self_employment_tracking') && !input.consentedPurposes.includes('placement_tracking')) {
            return {
                connectorName: this.name,
                result: 'inconclusive',
                confidence: 0,
                notice: 'Trainee consent not granted for self-employment tracking',
            };
        }
        if (input.outcomeType === 'self_employed') {
            return {
                connectorName: this.name,
                result: 'confirmed',
                confidence: 0.92,
                evidence: {
                    mockUdyamRegistration: `UDYAM-MH-${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000000 + Math.random() * 9000000)}`,
                    enterpriseType: 'Micro',
                    majorActivity: 'Services',
                    verifiedAt: new Date().toISOString(),
                },
                notice: 'Prototype Mock: Live Udyam access requires formal MSME API integration.',
            };
        }
        return {
            connectorName: this.name,
            result: 'inconclusive',
            confidence: 0.1,
            notice: 'Outcome is not flagged as self-employment.',
        };
    }
}
exports.UdyamMockConnector = UdyamMockConnector;
exports.udyamMockConnector = new UdyamMockConnector();
