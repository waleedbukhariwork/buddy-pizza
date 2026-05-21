import { ProductDetailPage } from '../../../components/views/product-detail'

export default function Page({ params }: { params: { id: string } }) {
	return <ProductDetailPage productId={Number(params.id)} />
}
