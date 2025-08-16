import React from 'react'
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { AdvancedImage } from '@cloudinary/react';

const CloudinaryImage = ({ publicId, width = 500, height = 500, className }) => {
  // Initialize Cloudinary with environment variable
  const cld = new Cloudinary({ 
    cloud: { 
      cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME 
    } 
  });
  
  if (!publicId) return null;
  
  const img = cld
    .image(publicId)
    .format('auto')
    .quality('auto')
    .resize(auto().gravity(autoGravity()).width(width).height(height));

  return (
    <div className={className}>
      <AdvancedImage cldImg={img} />
    </div>
  );
};

export default CloudinaryImage;