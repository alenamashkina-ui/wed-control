import React from 'react';
import { LOGO_URL, APP_TITLE } from '../../constants';

export const Logo = ({ className }) => ( 
  <img src={LOGO_URL} alt={APP_TITLE} className={`object-contain ${className}`} /> 
);
