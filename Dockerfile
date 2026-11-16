FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish GlobalTextSummarizer/GlobalTextSummarizer.csproj -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ConnectionStrings__DefaultConnection="postgresql://neondb_owner:npg_JGHd7q9ZDFMz@ep-late-cherry-amnwde9q-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"
ENTRYPOINT ["dotnet", "GlobalTextSummarizer.dll"]