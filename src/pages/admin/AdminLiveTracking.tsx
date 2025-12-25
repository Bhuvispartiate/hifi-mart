import { Helmet } from 'react-helmet';
import DeliveryLiveMap from '@/components/admin/DeliveryLiveMap';

const AdminLiveTracking = () => {
  return (
    <>
      <Helmet>
        <title>Live Tracking - Admin Portal</title>
        <meta name="description" content="Track delivery partners in real-time on a live map" />
      </Helmet>
      
      <div className="h-[calc(100vh-6rem)] -m-6">
        <DeliveryLiveMap />
      </div>
    </>
  );
};

export default AdminLiveTracking;
