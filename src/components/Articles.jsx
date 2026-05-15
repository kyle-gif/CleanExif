import React from 'react';
import { Shield, Cpu, Image as ImageIcon, Edit3 } from 'lucide-react';

const Articles = () => {
  return (
    <div className="mt-20 border-t border-leica-gray pt-16 mb-16 text-leica-lightgray font-sans">
      <div className="max-w-5xl mx-auto flex flex-col gap-16">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 tracking-tight">
            Understanding and Managing Image Metadata
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            A comprehensive guide to EXIF data, digital privacy, and the technical mechanisms behind secure, client-side photo processing.
          </p>
        </div>

        {/* Section 1 */}
        <section className="flex flex-col md:flex-row gap-8 items-start">
          <div className="md:w-1/3 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full bg-leica-darkgray border border-leica-gray flex items-center justify-center">
              <Shield className="text-leica-red" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">The Hidden Footprint: What is EXIF Data?</h3>
          </div>
          <div className="md:w-2/3 flex flex-col gap-5 text-base md:text-lg text-gray-300 leading-relaxed">
            <p>
              When a photograph is captured using a modern digital camera or smartphone, the image file contains far more than just pixel data. It embeds Exchangeable Image File Format (EXIF) metadata. This standard, established by the Japan Electronic Industries Development Association (JEIDA), records precise technical specifications at the moment of capture.
            </p>
            <p>
              This includes exposure settings (shutter speed, aperture, ISO), camera model, focal length, and most critically, <strong>GPS latitude and longitude coordinates</strong>. While this information is invaluable for professional photographers analyzing their workflow, it poses a significant privacy risk when images are shared publicly on social media platforms or public forums, potentially exposing the exact location of a user's home or daily routines.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="flex flex-col md:flex-row gap-8 items-start">
          <div className="md:w-1/3 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full bg-leica-darkgray border border-leica-gray flex items-center justify-center">
              <Cpu className="text-leica-red" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Client-Side Processing & Privacy</h3>
          </div>
          <div className="md:w-2/3 flex flex-col gap-5 text-base md:text-lg text-gray-300 leading-relaxed">
            <p>
              Traditional online image editors often require users to upload their media to a remote server. This creates a vulnerability window where sensitive metadata could be logged, intercepted, or stored indefinitely without the user's explicit consent.
            </p>
            <p>
              CleanExif eliminates this risk entirely by utilizing modern Web APIs—specifically the <code>HTML5 Canvas</code> and <code>FileReader</code> APIs. By executing all image parsing, metadata stripping, and pixel manipulation directly within the browser's JavaScript engine, the application ensures a <strong>Zero-Trust architecture</strong>. Your files never leave your local device memory, guaranteeing absolute data sovereignty and privacy.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="flex flex-col md:flex-row gap-8 items-start">
          <div className="md:w-1/3 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full bg-leica-darkgray border border-leica-gray flex items-center justify-center">
              <ImageIcon className="text-leica-red" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Advanced Color Science & Grading</h3>
          </div>
          <div className="md:w-2/3 flex flex-col gap-5 text-base md:text-lg text-gray-300 leading-relaxed">
            <p>
              Beyond privacy management, CleanExif integrates sophisticated color grading algorithms designed to emulate the aesthetics of classic analog photography. Understanding the technical implementation of these features can significantly enhance your creative output.
            </p>
            <ul className="list-none space-y-4 mt-2">
              <li className="pl-4 border-l-2 border-gray-700">
                <strong className="text-white block mb-1">Dynamic Range Clipping (DR Clip)</strong>
                By intentionally compressing and clipping the highlight values (similar to the characteristic curve of film stock), users can replicate the dense, high-contrast look synonymous with vintage rangefinder cameras.
              </li>
              <li className="pl-4 border-l-2 border-gray-700">
                <strong className="text-white block mb-1">Atmospheric Haze Manipulation</strong>
                The custom Dehaze algorithm operates on the image's luminance map. Applying negative values effectively introduces a soft-focus bloom or 'haze', mimicking the halation effect seen in uncoated vintage lenses under strong backlighting.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section className="flex flex-col md:flex-row gap-8 items-start">
          <div className="md:w-1/3 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full bg-leica-darkgray border border-leica-gray flex items-center justify-center">
              <Edit3 className="text-leica-red" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Metadata Injection (Spoofing)</h3>
          </div>
          <div className="md:w-2/3 flex flex-col gap-5 text-base md:text-lg text-gray-300 leading-relaxed">
            <p>
              For digital artists and photographers managing their online portfolios, maintaining consistent presentation is key. CleanExif provides the ability to reconstruct the EXIF Image File Directory (IFD0 and ExifIFD) from scratch. 
            </p>
            <p>
              This allows users to inject custom camera makes, lens models, and exposure parameters into the final JPEG binary. Whether you are standardizing your portfolio's metadata or protecting the identity of your proprietary equipment, this feature provides granular control over the digital footprint of your published work.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Articles;
