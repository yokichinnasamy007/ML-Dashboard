import axios from "axios";

const http = axios.create({ baseURL: "/api", timeout: 30_000 });

export const getHealth          = ()       => http.get("/health");
export const getSupervisedData  = ()       => http.get("/data/supervised");
export const getUnsupervisedData= ()       => http.get("/data/unsupervised");
export const postPredict        = (body)   => http.post("/predict", body);
export const postCluster        = (body)   => http.post("/cluster", body);
