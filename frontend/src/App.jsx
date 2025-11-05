

import axios from "./api/axios";
import SuperAdminLogin from './pages/SuperAdminLogin'

export default function App(){
  const TestApi = async ()=>{
    const res = await axios.get('/');
    console.log('backend response',res.data)
  }
  return (
    <div>
      <SuperAdminLogin />
      
    </div>
  )
}