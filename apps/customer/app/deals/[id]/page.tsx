import { DealDetailPage } from '../../../components/views/deal-detail'

export default function Page({ params }: { params: { id: string } }) {
	return <DealDetailPage dealId={Number(params.id)} />
}
