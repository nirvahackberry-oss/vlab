import json
import os

def lambda_handler(event, context):
    # In a production environment, this would be fetched from a DynamoDB 'catalog' table.
    # For now, we hardcode to match the frontend requirement exactly.
    labs = [
        {
            "id": "python",
            "title": "Python for Data Science",
            "subtitle": "Interactive Development Environment",
            "logo": "https://img.icons8.com/color/48/000000/python--v1.png",
            "rating": 4.5,
            "reviewCount": 12,
            "durationMinutes": 60,
            "credits": 20,
            "complexity": "Beginner",
            "category": "Data Science",
            "description": "Learn the fundamentals of Python in a guided cloud environment.",
            "status": "ready"
        },
        {
            "id": "java",
            "title": "Java Spring Boot Masterclass",
            "subtitle": "Enterprise Application Hub",
            "logo": "https://img.icons8.com/color/48/000000/java-coffee-cup-logo.png",
            "rating": 4.8,
            "reviewCount": 34,
            "durationMinutes": 120,
            "credits": 40,
            "complexity": "Intermediate",
            "category": "Web Development",
            "description": "Build and deploy scalable enterprise applications with Spring Boot.",
            "status": "ready"
        },
        {
            "id": "linux",
            "title": "Linux Systems Ops",
            "subtitle": "Infrastructure Mastery Lab",
            "logo": "https://img.icons8.com/color/48/000000/linux--v1.png",
            "rating": 4.9,
            "reviewCount": 56,
            "durationMinutes": 90,
            "credits": 30,
            "complexity": "Expert",
            "category": "DevOps",
            "description": "Deep dive into Linux internals and server management.",
            "status": "ready"
        }
    ]
    
    # Handle single lab fetch: GET /labs/{labId}
    path_parameters = event.get('pathParameters')
    if path_parameters and 'labId' in path_parameters:
        lab_id = path_parameters['labId']
        lab = next((l for l in labs if l['id'] == lab_id), None)
        if lab:
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"success": True, "lab": lab})
            }
        return {
            "statusCode": 404,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"success": False, "message": "Lab not found"})
        }

    # Default: GET /labs
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"success": True, "labs": labs})
    }
