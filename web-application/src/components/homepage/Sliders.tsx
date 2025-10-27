"use client";

import { Spin } from "antd";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { ListSliderResponse } from "@/types-openapi/api";

interface SlidersProps {
  sliders: ListSliderResponse[];
  isLoading: boolean;
}

const Sliders = ({ sliders, isLoading }: SlidersProps) => {
  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!sliders || sliders.length === 0) {
    return (
      <div className="flex h-96 w-full items-center justify-center bg-gray-100">
        <p className="text-gray-500">Không có slider nào</p>
      </div>
    );
  }

  return (
    <div className="relative h-96 w-full overflow-hidden">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        className="h-full w-full"
      >
        {sliders.map((slider) => (
          <SwiperSlide key={slider.id} className="relative">
            <div className="relative h-96 w-full">
              <Image src={slider.imageUrl ?? ""} alt={slider.title ?? "Slider"} fill className="object-cover" priority={false} sizes="100vw" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Sliders;
