"use client";

import Blogs from "@/components/homepage/Blogs";
import Products from "@/components/homepage/Products";
import Sliders from "@/components/homepage/Sliders";
import UserCourtSchedule from "@/components/homepage/UserCourtSchedule";
import { useListBlogs } from "@/hooks/useBlogs";
import { useListCourtGroupByCourtArea } from "@/hooks/useCourt";
import { useListProductsForWeb } from "@/hooks/useProducts";
import { useUserListSliders } from "@/hooks/useSlider";
import React from "react";

const HomePage = () => {
  const { data: slidersData, isLoading: isLoadingSliders } = useUserListSliders();
  const { data: courtGroupByCourtAreaData } = useListCourtGroupByCourtArea();
  const { data: productsData, isLoading: isLoadingProducts } = useListProductsForWeb({});
  const { data: blogsData, isLoading: isLoadingBlogs } = useListBlogs({});

  return (
    <div>
      <section>
        <Sliders sliders={slidersData?.data ?? []} isLoading={isLoadingSliders} />
      </section>

      <section className="container mx-auto mt-10">
        <h2 className="text-2xl font-bold">Đặt sân online</h2>
        <p className="text-gray-500">Đặt sân online để tiết kiệm thời gian và chi phí.</p>

        <UserCourtSchedule courts={courtGroupByCourtAreaData?.data ?? []} />
      </section>

      <section id="products" className="container mx-auto mt-10 px-4">
        <h2 className="text-2xl font-bold">Sản phẩm nổi bật</h2>
        <p className="text-gray-500">Các sản phẩm đang được bán trên web</p>

        <Products products={productsData?.data ?? []} isLoading={isLoadingProducts} limit={8} />
      </section>

      <section className="container mx-auto mt-10 px-4">
        <h2 className="text-2xl font-bold">Bài viết nổi bật</h2>
        <p className="text-gray-500">Bài viết về sân cầu lông</p>

        <Blogs blogs={blogsData?.data ?? []} isLoading={isLoadingBlogs} limit={6} />
      </section>
    </div>
  );
};

export default HomePage;
