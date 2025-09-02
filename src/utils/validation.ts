import Joi from "joi";

// joi is a data validation library for Node.js. 
export const domainSchema = Joi.object({
  // validate the domain if it is valid 
  domain: Joi.string().domain({ tlds: { allow: true } }).required()
});