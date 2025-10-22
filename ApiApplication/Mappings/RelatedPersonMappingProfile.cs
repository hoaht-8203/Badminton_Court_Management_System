using System;
using ApiApplication.Dtos.RelationPerson;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class RelatedPersonMappingProfile : Profile
{
    public RelatedPersonMappingProfile()
    {
        CreateMap<RelatedPerson, RelatedPersonResponse>();
        CreateMap<CreateRelatedPersonRequest, RelatedPerson>()
            .ForMember(d => d.Id, opt => opt.Ignore());
        CreateMap<UpdateRelatedPersonRequest, RelatedPerson>();
    }
}
