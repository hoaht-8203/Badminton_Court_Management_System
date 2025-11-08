using ApiApplication.Dtos.Feedback;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class FeedbackMappingProfile : Profile
{
    public FeedbackMappingProfile()
    {
        CreateMap<Feedback, ListFeedbackResponse>();
        CreateMap<Feedback, DetailFeedbackResponse>();
        CreateMap<CreateFeedbackRequest, Feedback>();
        CreateMap<UpdateFeedbackRequest, Feedback>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
    }
}
