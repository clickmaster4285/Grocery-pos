{
  "message": "how many user/employee do i have ?"
}

{
    "success": true,
    "message": "Action completed successfully",
    "intent": {
        "schema_version": "1.0.0",
        "tool": "hr",
        "action": "SHIFT_STATUS",
        "params": {
            "filter": "user count",
            "limit": null,
            "timeframe": null,
            "threshold": null
        },
        "confidence": 0.75
    },
    "data": [
        {
            "name": "Admin User",
            "role": "admin",
            "shift": "undefined - undefined",
            "work_days": "N/A"
        },
        {
            "name": "M Ali",
            "role": "manager",
            "designation": "",
            "shift": "09:00 - 17:00",
            "work_days": "Monday, Tuesday, Wednesday, Thursday, Friday"
        }
    ]
}





{
  "message": "Give me a summary of today's sales"
}


{
    "success": true,
    "message": "Action completed successfully",
    "intent": {
        "schema_version": "1.0.0",
        "tool": "sales",
        "action": "TODAY_SUMMARY",
        "params": {
            "timeframe": "today"
        },
        "confidence": 0.98
    },
    "data": {
        "date": "27/02/2026",
        "total_revenue": 0,
        "transactions": 0,
        "average_ticket": 0
    }
}






{
  "message":  "Which items are running low on stock?"
}

{
    "success": true,
    "message": "Action completed successfully",
    "intent": {
        "schema_version": "1.0.0",
        "tool": "inventory",
        "action": "LOW_STOCK",
        "params": {
            "threshold": null,
            "limit": 5
        },
        "confidence": 0.98
    },
    "data": [
        {
            "name": "T-shirt",
            "sku": "TSHI-SMALPURP-Z32T",
            "current_quantity": 8,
            "unit": "PIECE"
        },
        {
            "name": "Orange",
            "sku": "ORAN-MEDIYELL-KRYN",
            "current_quantity": 10,
            "unit": "PIECE"
        }
    ]
}


{
  "message":  "Who is scheduled to work today?"
}

{
    "success": true,
    "message": "Action completed successfully",
    "intent": {
        "schema_version": "1.0.0",
        "tool": "hr",
        "action": "SHIFT_STATUS",
        "params": {
            "timeframe": "today"
        },
        "confidence": 0.95
    },
    "data": [
        {
            "name": "Admin User",
            "role": "admin",
            "shift": "undefined - undefined",
            "work_days": "N/A"
        },
        {
            "name": "M Ali",
            "role": "manager",
            "designation": "",
            "shift": "09:00 - 17:00",
            "work_days": "Monday, Tuesday, Wednesday, Thursday, Friday"
        }
    ]
}


when i missplled  
{
  "message":  "how many brcnhse i have ?"
}

{
    "success": true,
    "message": "Action completed successfully",
    "intent": {
        "schema_version": "1.0.0",
        "tool": "sales",
        "action": "TODAY_SUMMARY",
        "params": {
            "limit": null,
            "timeframe": "today"
        },
        "confidence": 0.75
    },
    "data": {
        "date": "27/02/2026",
        "total_revenue": 0,
        "transactions": 0,
        "average_ticket": 0
    }
}