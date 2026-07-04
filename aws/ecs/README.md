# Deploying CareerPilot to AWS

## 1. Build & push images
Each service has the same pattern (add this Dockerfile to each service root):

```dockerfile
FROM eclipse-temurin:17-jre
COPY target/*.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
```

```bash
aws ecr create-repository --repository-name careerpilot/question-service
mvn clean package -DskipTests
docker build -t careerpilot/question-service .
docker tag careerpilot/question-service:latest <acct>.dkr.ecr.us-east-1.amazonaws.com/careerpilot/question-service:latest
aws ecr get-login-password | docker login --username AWS --password-stdin <acct>.dkr.ecr.us-east-1.amazonaws.com
docker push <acct>.dkr.ecr.us-east-1.amazonaws.com/careerpilot/question-service:latest
```

## 2. Managed replacements for local infra
| Local (docker-compose) | AWS |
|---|---|
| PostgreSQL | RDS PostgreSQL |
| MongoDB | DocumentDB (or MongoDB Atlas) |
| Kafka | Amazon MSK Serverless |
| Keycloak | Keycloak on ECS, or swap to Cognito |

Override connection strings via ECS task environment variables
(SPRING_DATASOURCE_URL, SPRING_DATA_MONGODB_URI, SPRING_KAFKA_BOOTSTRAP_SERVERS).

## 3. ECS Fargate
- One cluster `careerpilot`, one service per microservice
- Task role (NOT execution role) needs: bedrock:InvokeModel, textract:*,
  comprehend:Detect*, s3 access to the resume bucket
- ALB in front of api-gateway only; services communicate via Cloud Map
  service discovery on the private subnets
- See task-definition-example.json

## 4. Frontend
`ng build` -> upload dist/ to S3 -> CloudFront distribution.

## 5. Observability (interview gold)
- CloudWatch Container Insights on the cluster
- Structured JSON logs (net.logstash.logback) -> CloudWatch Logs Insights
- X-Ray sidecar or ADOT for tracing across gateway -> services -> Bedrock
