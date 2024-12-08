import RoidsPurchase from '../../components/pricing/RoidsPurchase';

export default function PurchasePage() {
    // Get userId from your auth system
    const userId = 'user_id_here';

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-center my-8">Purchase ROIDS</h1>
            <RoidsPurchase userId={userId} />
        </div>
    );
} 