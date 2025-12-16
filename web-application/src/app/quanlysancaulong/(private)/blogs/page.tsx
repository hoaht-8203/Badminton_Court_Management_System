"use client";

import CreateBlogDrawer from "@/components/quanlysancaulong/blogs/create-blog-drawer";
import { columns } from "@/components/quanlysancaulong/blogs/blogs-columns";
import SearchBlogs from "@/components/quanlysancaulong/blogs/search-blogs";
import UpdateBlogDrawer from "@/components/quanlysancaulong/blogs/update-blog-drawer";
import { useDeleteBlog, useListBlogs } from "@/hooks/useBlogs";
import { ApiError } from "@/lib/axios";
import { ListBlogRequest, ListBlogResponse } from "@/types-openapi/api";
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Col, Divider, Image, message, Modal, Row, Table, TableProps } from "antd";
import { useMemo, useState } from "react";

const tableProps: TableProps<ListBlogResponse> = {
  rowKey: "id",
  size: "small",
  scroll: { x: "max-content" },
  expandable: {
    expandRowByClick: true,
  },
  onRow: () => ({
    style: {
      cursor: "pointer",
    },
  }),
  bordered: true,
};

const BlogsPage = () => {
  const [searchParams, setSearchParams] = useState<ListBlogRequest>({
    title: null,
    status: null,
  });
  const [openCreateBlogDrawer, setOpenCreateBlogDrawer] = useState(false);
  const [openUpdateBlogDrawer, setOpenUpdateBlogDrawer] = useState(false);
  const [openContentModal, setOpenContentModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<ListBlogResponse | null>(null);
  const [blogId, setBlogId] = useState<string | null>(null);
  const [modal, contextHolder] = Modal.useModal();

  const { data: blogsData, isFetching: loadingBlogsData, refetch: refetchBlogsData } = useListBlogs(searchParams);

  const deleteBlogMutation = useDeleteBlog();

  const handleClickUpdateBlog = (record: ListBlogResponse) => {
    setOpenUpdateBlogDrawer(true);
    setBlogId(record.id ?? null);
  };

  const handleClickViewContent = (record: ListBlogResponse) => {
    setSelectedBlog(record);
    setOpenContentModal(true);
  };

  const handleClickDeleteBlog = (record: ListBlogResponse) => {
    modal.confirm({
      title: "Xác nhận",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa blog này?</p>
          <p>
            Lưu ý: Blog <span className="font-bold text-red-500">{record.title}</span> sẽ bị xóa vĩnh viễn và không thể khôi phục.
          </p>
        </div>
      ),
      onOk: async () => {
        if (!record.id) {
          message.error("Không xác định được mã blog để xóa");
          return;
        }

        try {
          await deleteBlogMutation.mutateAsync({
            id: record.id,
          });
          message.success("Xóa blog thành công!");
        } catch (error) {
          const apiError = error as ApiError;
          message.error(apiError.message || "Có lỗi xảy ra khi xóa blog");
        }
      },
      okText: "Xác nhận",
      cancelText: "Hủy",
    });
  };

  return (
    <section>
      <div className="mb-4">
        <Breadcrumb
          items={[
            {
              title: "Quản trị ứng dụng",
            },
            {
              title: "Quản lý blog",
            },
          ]}
        />
      </div>

      <div className="mb-2">
        <SearchBlogs onSearch={setSearchParams} onReset={() => setSearchParams({ title: null, status: null })} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold text-green-500">Tổng số blog: {blogsData?.data?.length ?? 0}</span>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreateBlogDrawer(true)}>
              Thêm blog
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetchBlogsData()}>
              Tải lại
            </Button>
          </div>
        </div>

        <Table<ListBlogResponse>
          {...tableProps}
          columns={columns}
          dataSource={blogsData?.data ?? []}
          loading={loadingBlogsData}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => (
              <div key={`blog-info-${record.id}`}>
                <BlogInformation
                  record={record}
                  handleClickUpdateBlog={() => handleClickUpdateBlog(record)}
                  handleClickDeleteBlog={() => handleClickDeleteBlog(record)}
                  handleClickViewContent={() => handleClickViewContent(record)}
                />
              </div>
            ),
          }}
        />
      </div>

      <CreateBlogDrawer open={openCreateBlogDrawer} onClose={() => setOpenCreateBlogDrawer(false)} />

      <UpdateBlogDrawer open={openUpdateBlogDrawer} onClose={() => setOpenUpdateBlogDrawer(false)} blogId={blogId ?? ""} />

      <Modal
        title="Nội dung blog"
        open={openContentModal}
        onCancel={() => setOpenContentModal(false)}
        footer={[
          <Button key="close" onClick={() => setOpenContentModal(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
        style={{ top: 20 }}
        maskClosable
      >
        {selectedBlog && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{selectedBlog.title}</h3>
              <p className="text-sm text-gray-500">
                Tạo lúc: {selectedBlog.createdAt ? new Date(selectedBlog.createdAt).toLocaleString("vi-VN") : "-"}
              </p>
            </div>
            <div className="rounded bg-gray-50 p-4" style={{ border: "1px solid #e0e0e0" }}>
              <div className="prose blog-content max-w-none" dangerouslySetInnerHTML={{ __html: selectedBlog.content ?? "" }} />
            </div>
          </div>
        )}
      </Modal>

      {contextHolder}
    </section>
  );
};

const BlogInformation = ({
  record,
  handleClickUpdateBlog,
  handleClickDeleteBlog,
  handleClickViewContent,
}: {
  record: ListBlogResponse;
  handleClickUpdateBlog: () => void;
  handleClickDeleteBlog: () => void;
  handleClickViewContent: () => void;
}) => {
  const blogInfo = useMemo(
    () => (
      <div>
        <Row gutter={16} className="mb-4">
          <Col span={8}>
            <Row gutter={16}>
              <Col span={6}>Mã blog:</Col>
              <Col span={18}>{record.id ?? "-"}</Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
              <Col span={6}>Tiêu đề:</Col>
              <Col span={18}>{record.title}</Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
              <Col span={6}>Trạng thái:</Col>
              <Col span={18}>
                {record.status === "Active" ? (
                  <span className="font-bold text-green-500">Đang hoạt động</span>
                ) : (
                  <span className="font-bold text-red-500">Không hoạt động</span>
                )}
              </Col>
            </Row>
          </Col>
          <Divider type="vertical" size="small" style={{ height: "auto" }} />
          <Col span={8}>
            <Row gutter={16}>
              <Col span={6}>Hình ảnh:</Col>
              <Col span={18}>
                {record.imageUrl ? (
                  <Image src={record.imageUrl} alt={record.title ?? ""} width={300} className="rounded object-cover" preview={false} />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded bg-gray-200">
                    <span className="text-gray-500">Không có hình</span>
                  </div>
                )}
              </Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
              <Col span={6}>Ngày tạo:</Col>
              <Col span={18}>{record.createdAt ? new Date(record.createdAt).toLocaleString("vi-VN") : "-"}</Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
              <Col span={6}>Cập nhật:</Col>
              <Col span={18}>{record.updatedAt ? new Date(record.updatedAt).toLocaleString("vi-VN") : "-"}</Col>
            </Row>
          </Col>
          <Divider type="vertical" size="small" style={{ height: "auto" }} />

          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button type="primary" icon={<EditOutlined />} onClick={handleClickUpdateBlog}>
                Cập nhật blog
              </Button>
              <Button icon={<EyeOutlined />} onClick={handleClickViewContent}>
                Xem nội dung
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={handleClickDeleteBlog}>
                Xóa blog
              </Button>
            </div>
          </div>
        </Row>
      </div>
    ),
    [record, handleClickUpdateBlog, handleClickDeleteBlog, handleClickViewContent],
  );

  return blogInfo;
};

export default BlogsPage;
