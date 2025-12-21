import { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const ShareDoc = () => {
  const { id: docId } = useParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter an email');

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/docs/${docId}/share`,
        { email },
        { withCredentials: true }
      );

      toast.success(data.message || 'User added as collaborator');
      setEmail('');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to share document'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleShare} style={{ margin: '1rem 0' }}>
      <input
        type="email"
        placeholder="Collaborator's email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{ padding: '0.5rem', marginRight: '0.5rem' }}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sharing...' : 'Share'}
      </button>
    </form>
  );
};

export default ShareDoc;
