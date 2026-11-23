// Simple Gemini-backed chat server. Keep your API key in .env, never in browser code.
const express=require('express');
const path=require('path');
require('dotenv').config();
const app=express();
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname,'public')));
app.post('/api/chat',async(req,res)=>{
 try{
  const key=process.env.GEMINI_API_KEY;
  if(!key)return res.status(500).json({error:'Server config missing GEMINI_API_KEY'});
  const msgs=Array.isArray(req.body.messages)?req.body.messages.slice(-20):[];
  const contents=msgs.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:String(m.content||'').slice(0,8000)}]}));
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL||'gemini-2.5-flash'}:generateContent?key=${encodeURIComponent(key)}`,{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({systemInstruction:{parts:[{text:'You are a helpful, safe assistant. Answer clearly, preferably in the language the user uses. Do not assist with harmful, illegal, dangerous, or age-inappropriate activities.'}]},contents,generationConfig:{temperature:0.7,maxOutputTokens:2048}})
  });
  const data=await response.json();
  if(!response.ok)return res.status(response.status).json({error:data.error?.message||'Gemini request failed'});
  const reply=data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'No response';
  res.json({reply});
 }catch(e){res.status(500).json({error:e.message||'Server error'})}
});
const port=process.env.PORT||3000;
app.listen(port,()=>console.log('KAWSAR GPT server running on port '+port));
