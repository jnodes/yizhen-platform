# Yizhen Compliance API Documentation

## Overview

The Yizhen Compliance API provides programmatic access to compliance checks, KYC verification, risk assessment, and transaction monitoring. This RESTful API supports JSON requests and responses.

## Base URL

```
Production: https://api.yizhen-compliance.com/v1
Staging: https://api-staging.yizhen-compliance.com/v1
```

## Authentication

All API requests require authentication using an API key in the header:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.yizhen-compliance.com/v1/compliance/check
```

## Rate Limits

- **Standard**: 100 requests per minute
- **Premium**: 1,000 requests per minute
- **Enterprise**: Custom limits

## Endpoints

### 1. Compliance Check

**POST** `/compliance/check`

Performs a comprehensive compliance check for a wallet address.

#### Request Body

```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f6E28f",
  "transactionData": {
    "type": "bid",
    "amount": 50000,
    "currency": "USDT",
    "artifactId": "123"
  },
  "checkTypes": ["kyc", "aml", "sanctions", "risk", "jurisdiction"]
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f6E28f",
    "timestamp": 1643723400000,
    "overallStatus": "approved",
    "kyc": {
      "status": "verified",
      "level": "enhanced",
      "verificationId": "KYC-1643723400000-a2b3c4d5",
      "expiryDate": 1675259400000
    },
    "aml": {
      "status": "clear",
      "score": 0.23,
      "flags": [],
      "lastChecked": 1643723400000
    },
    "sanctions": {
      "status": "clear",
      "matches": [],
      "lastChecked": 1643723400000
    },
    "riskScore": {
      "score": 0.31,
      "category": "low",
      "factors": {
        "walletAge": 0.15,
        "transactionVolume": 0.25,
        "geoRisk": 0.20,
        "velocityRisk": 0.35,
        "networkRisk": 0.40
      }
    },
    "jurisdiction": {
      "status": "allowed",
      "jurisdiction": {
        "code": "US",
        "name": "United States",
        "riskLevel": "medium"
      },
      "requirements": ["enhanced-kyc", "source-of-funds"]
    },
    "recommendations": [
      {
        "type": "kyc",
        "priority": "low",
        "action": "Update proof of address",
        "details": "Document expires in 30 days"
      }
    ]
  }
}
```

### 2. KYC Verification

**POST** `/kyc/verify`

Initiates or updates KYC verification for a user.

#### Request Body

```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f6E28f",
  "level": "enhanced",
  "documents": [
    {
      "type": "government-id",
      "documentId": "DOC-123456",
      "status": "submitted"
    },
    {
      "type": "proof-of-address",
      "documentId": "DOC-789012",
      "status": "submitted"
    }
  ],
  "userData": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01",
    "nationality": "US"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "verificationId": "KYC-1643723400000-a2b3c4d5",
    "status": "in-progress",
    "estimatedCompletion": 1643726400000,
    "nextSteps": [
      {
        "step": "document-review",
        "status": "pending",
        "description": "Documents under review"
      },
      {
        "step": "identity-verification",
        "status": "pending",
        "description": "Facial recognition pending"
      }
    ]
  }
}
```

### 3. Risk Assessment

**POST** `/risk/assess`

Performs real-time risk assessment for a transaction.

#### Request Body

```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f6E28f",
  "transaction": {
    "to": "0x3f4e8B2C4D6E8F0A2B4C6D8E0F2A4B6C8D0E2F4A",
    "value": 100000,
    "data": "0x",
    "gasPrice": "20000000000",
    "gasLimit": "21000"
  },
  "context": {
    "platform": "yizhen",
    "action": "bid",
    "metadata": {
      "artifactId": "123",
      "auctionId": "456"
    }
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "riskScore": 0.42,
    "riskLevel": "medium",
    "factors": {
      "transactionSize": {
        "score": 0.35,
        "weight": 0.20,
        "reason": "Large transaction relative to history"
      },
      "counterpartyRisk": {
        "score": 0.50,
        "weight": 0.30,
        "reason": "New counterparty address"
      },
      "velocityRisk": {
        "score": 0.25,
        "weight": 0.15,
        "reason": "Normal transaction frequency"
      },
      "patternRisk": {
        "score": 0.60,
        "weight": 0.35,
        "reason": "Unusual time of transaction"
      }
    },
    "alerts": [
      {
        "type": "transaction-size",
        "severity": "medium",
        "message": "Transaction 5x larger than average"
      }
    ],
    "recommendation": "manual-review"
  }
}
```

### 4. Transaction Monitoring

**POST** `/monitoring/transaction`

Records a transaction for compliance monitoring.

#### Request Body

```json
{
  "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f6E28f",
  "type": "bid",
  "amount": 50000,
  "timestamp": 1643723400000,
  "metadata": {
    "artifactId": "123",
    "auctionId": "456",
    "platform": "yizhen"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "monitoringId": "MON-1643723400000-x1y2z3",
    "status": "recorded",
    "alerts": [],
    "complianceStatus": "compliant"
  }
}
```

### 5. Sanctions Screening

**POST** `/sanctions/screen`

Screens an address against global sanctions lists.

#### Request Body

```json
{
  "addresses": [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f6E28f",
    "0x3f4e8B2C4D6E8F0A2B4C6D8E0F2A4B6C8D0E2F4A"
  ],
  "lists": ["OFAC", "EU", "UN", "UK"],
  "includeSecondaryMatches": true
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "screeningId": "SCR-1643723400000-a1b2c3",
    "timestamp": 1643723400000,
    "results": [
      {
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f6E28f",
        "status": "clear",
        "matches": []
      },
      {
        "address": "0x3f4e8B2C4D6E8F0A2B4C6D8E0F2A4B6C8D0E2F4A",
        "status": "potential-match",
        "matches": [
          {
            "list": "OFAC",
            "matchType": "fuzzy",
            "confidence": 0.75,
            "entity": {
              "name": "Similar Entity Name",
              "type": "individual",
              "programs": ["CYBER2"]
            }
          }
        ]
      }
    ]
  }
}
```

### 6. Jurisdiction Check

**GET** `/jurisdiction/check/{walletAddress}`

Determines the jurisdiction of a wallet address.

#### Response

```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f6E28f",
    "jurisdiction": {
      "code": "US",
      "name": "United States",
      "state": "NY",
      "city": "New York"
    },
    "ipLocation": {
      "country": "US",
      "region": "New York",
      "city": "New York",
      "lat": 40.7128,
      "lon": -74.0060
    },
    "riskLevel": "medium",
    "restrictions": [
      "enhanced-kyc-required",
      "source-of-funds-required"
    ],
    "allowed": true
  }
}
```

### 7. Compliance Report

**GET** `/reports/compliance`

Generates a compliance report for a specific time period.

#### Query Parameters

- `startDate`: ISO 8601 date string
- `endDate`: ISO 8601 date string
- `format`: `json` | `pdf` | `csv`
- `type`: `summary` | `detailed` | `regulatory`

#### Response

```json
{
  "success": true,
  "data": {
    "reportId": "RPT-1643723400000-x1y2z3",
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    },
    "summary": {
      "totalTransactions": 45678,
      "totalVolume": 123456789,
      "complianceRate": 0.987,
      "flaggedTransactions": 234,
      "blockedTransactions": 45
    },
    "kycMetrics": {
      "newVerifications": 1234,
      "renewals": 567,
      "expirations": 89,
      "averageCompletionTime": 14400
    },
    "riskMetrics": {
      "averageRiskScore": 0.31,
      "highRiskUsers": 123,
      "riskDistribution": {
        "low": 0.75,
        "medium": 0.20,
        "high": 0.04,
        "critical": 0.01
      }
    },
    "downloadUrl": "https://api.yizhen-compliance.com/v1/reports/download/RPT-1643723400000-x1y2z3"
  }
}
```

### 8. Webhook Configuration

**POST** `/webhooks/configure`

Configures webhooks for compliance events.

#### Request Body

```json
{
  "url": "https://your-domain.com/webhooks/compliance",
  "events": [
    "kyc.completed",
    "kyc.failed",
    "risk.high",
    "sanctions.match",
    "transaction.blocked"
  ],
  "secret": "your-webhook-secret",
  "active": true
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "webhookId": "WHK-1643723400000-a1b2c3",
    "status": "active",
    "testUrl": "https://api.yizhen-compliance.com/v1/webhooks/test/WHK-1643723400000-a1b2c3"
  }
}
```

## Webhook Events

### Event Structure

```json
{
  "id": "evt_1643723400000_a1b2c3",
  "type": "kyc.completed",
  "timestamp": 1643723400000,
  "data": {
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f6E28f",
    "verificationId": "KYC-1643723400000-a2b3c4d5",
    "status": "verified",
    "level": "enhanced"
  }
}
```

### Event Types

| Event | Description |
|-------|-------------|
| `kyc.completed` | KYC verification completed successfully |
| `kyc.failed` | KYC verification failed |
| `kyc.expired` | KYC verification expired |
| `risk.high` | High risk detected for user/transaction |
| `risk.critical` | Critical risk requiring immediate action |
| `sanctions.match` | Sanctions list match detected |
| `transaction.blocked` | Transaction blocked by compliance |
| `transaction.flagged` | Transaction flagged for review |
| `monitoring.alert` | Monitoring system generated alert |

## Error Responses

### Error Structure

```json
{
  "success": false,
  "error": {
    "code": "INVALID_WALLET_ADDRESS",
    "message": "The provided wallet address is invalid",
    "details": {
      "field": "walletAddress",
      "value": "0xinvalid"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Access denied to resource |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_REQUEST` | 400 | Invalid request parameters |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## SDKs & Libraries

### JavaScript/TypeScript

```bash
npm install @yizhen/compliance-sdk
```

```javascript
import { YizhenCompliance } from '@yizhen/compliance-sdk';

const compliance = new YizhenCompliance({
  apiKey: 'YOUR_API_KEY',
  environment: 'production'
});

// Check compliance
const result = await compliance.checkCompliance({
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f6E28f',
  transactionData: {
    type: 'bid',
    amount: 50000
  }
});
```

### Python

```bash
pip install yizhen-compliance
```

```python
from yizhen_compliance import ComplianceClient

client = ComplianceClient(
    api_key='YOUR_API_KEY',
    environment='production'
)

# Check compliance
result = client.check_compliance(
    wallet_address='0x742d35Cc6634C0532925a3b844Bc9e7595f6E28f',
    transaction_data={
        'type': 'bid',
        'amount': 50000
    }
)
```

## Best Practices

1. **Cache Results**: Cache compliance check results for 5 minutes to reduce API calls
2. **Batch Requests**: Use batch endpoints when checking multiple addresses
3. **Webhook Verification**: Always verify webhook signatures
4. **Error Handling**: Implement exponential backoff for retries
5. **Rate Limiting**: Monitor your rate limit usage via response headers

## Testing

Use the staging environment for testing:

```
https://api-staging.yizhen-compliance.com/v1
```

Test API Key: `test_pk_1234567890abcdef`

## Support

- **Email**: api-support@yizhen-compliance.com
- **Documentation**: https://docs.yizhen-compliance.com
- **Status Page**: https://status.yizhen-compliance.com

---

**API Version**: 1.0.0  
**Last Updated**: January 2025
