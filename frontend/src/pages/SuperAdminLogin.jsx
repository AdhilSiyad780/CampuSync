import { useState ,useEffect} from "react";
import { useNavigate } from "react-router-dom";

export default function SuperAdminLogin(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) navigate("/dashboard"); // redirect to the dashboard if already logged in
      }, [navigate]);
    
    const handleLogin = async(e)=>{
        e.preventDefault();
        
        const res = await fetch('http://127.0.0.1:8000/api/superadmin/login/',{
            method:'POST',
            headers:{'Content-type':'application/json'},
            body:JSON.stringify({email,password})
        });
        const data = await res.json()
        console.log("Login response:", data);

        if (!res.ok){
            setError(data.detail || 'Login Failed')
        }else{
            localStorage.setItem('access',data.access)
            navigate("/dashboard");
        }


    }
    return (

        <form onSubmit={handleLogin}>
            <h2>Welcome to Admin Login</h2>
            {error && <p style={{color:'red'}}>  {error}</p>}
            <input type="text"  placeholder="Enter your Email"  onChange={(e)=>setEmail(e.target.value)} />
            <input type="text" placeholder="Enter your password"  onChange={(e)=>setPassword(e.target.value)}/>
            <button type="submit" >Login</button>
        </form>
       
    )
    
}