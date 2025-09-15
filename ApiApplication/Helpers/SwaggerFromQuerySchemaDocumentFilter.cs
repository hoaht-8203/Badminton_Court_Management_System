using System;
using System.Reflection;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace ApiApplication.Helpers;

public class SwaggerFromQuerySchemaDocumentFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // Helper to check if a type is a concrete class (not abstract, not static, not generic def)
        static bool IsConcreteClass(Type t) =>
            t.IsClass && !t.IsAbstract && !t.IsGenericTypeDefinition;

        // All DTOs (Api.Dtos and sub-namespaces)
        var dtoTypes = assembly
            .GetTypes()
            .Where(t =>
                t.Namespace != null
                && t.Namespace.StartsWith("ApiApplication.Dtos")
                && IsConcreteClass(t)
            );

        // All Models (Api.Models and sub-namespaces)
        var modelTypes = assembly
            .GetTypes()
            .Where(t =>
                t.Namespace != null
                && t.Namespace.StartsWith("ApiApplication.Entities")
                && IsConcreteClass(t)
            );

        foreach (var type in dtoTypes.Concat(modelTypes))
        {
            context.SchemaGenerator.GenerateSchema(type, context.SchemaRepository);
        }
    }
}
