### Installation

1. Clone the repo
  ```sh
   git clone https://github.com/martinanajdovska/employee-management.git
```
2. Run the Docker container
   * Create a .env file and set up your environment variables for the database following the .env.example template
   * ```
     docker-compose up
     ```
4. Backend
   * Inside the backend folder
   * Create a .env file and set up your environment variables following the .env.example template
   ```
    ./mvnw spring-boot:run
   ```
