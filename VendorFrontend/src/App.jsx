import {BrowserRouter, Routes, Route} from "react-router-dom"

function App(){
  return (
    <BrowserRouter>
    <Routes>

      {/* Public buyer routes */}
      <Route path="/:slug" element={<div>Store Page</div>}/>
      <Route path="/:slug/:productSlug" element={<div>Product Page</div>}/>

      {/* Auth */}
      <Route path="/login" element={<div>Login Page</div>}/>

      {/* Protected seller routes */}
      <Route path="/dashboard" element={<div>Dashboard</div>}/>
      <Route path="/dashboard/products" element={<div>Products</div>}/>
      <Route path="/dashboard/categories" element={<div>Categories</div>}/>
      <Route path="/dashboard/settings" element={<div>Settings</div>}/>

    </Routes>
    </BrowserRouter>
    
  );
}

export default App;