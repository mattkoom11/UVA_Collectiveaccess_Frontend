import PageLayout from "@/components/layout/PageLayout";

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Page Header */}
        <div className="mb-12 md:mb-16 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
            About UVA Fashion
          </h1>
          <p className="text-sm md:text-base text-zinc-400 font-light max-w-2xl mx-auto">
            Exploring the intersection of fashion history, digital preservation, and cultural heritage
          </p>
        </div>

        {/* Main Content */}
        <div className="prose prose-invert prose-lg max-w-none space-y-8 md:space-y-12">
          {/* UVA Fashion Project */}
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight text-zinc-100">
              The UVA Fashion Project
            </h2>
            <div className="space-y-4 text-zinc-300 font-light leading-relaxed">
              <p>
                UVA Fashion is a digital exploration of the University of Virginia's historic clothing collection, 
                bringing together cutting-edge technology and archival scholarship to create an immersive experience 
                that bridges past and present.
              </p>
              <p>
                This platform serves as both a digital runway and an editorial magazine, presenting historic garments 
                in a context that honors their aesthetic beauty while providing rich historical and cultural context. 
                Each garment tells a story—not just of fashion and design, but of the people who wore them, the eras 
                they represent, and the cultural movements they embody.
              </p>
            </div>
          </section>

          {/* Historic Clothing Collection */}
          <section className="space-y-4 border-t border-zinc-800 pt-8 md:pt-12">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight text-zinc-100">
              The Historic Clothing Collection
            </h2>
            <div className="space-y-4 text-zinc-300 font-light leading-relaxed">
              <p>
                The University of Virginia's Historic Clothing Collection preserves garments spanning over a century 
                of American fashion history. From elegant evening gowns of the 1920s to structured suits of the 1950s, 
                each piece represents a moment in time, capturing the evolving aesthetics, materials, and techniques 
                of fashion design.
              </p>
              <p>
                This collection serves as an invaluable resource for researchers, students, and fashion enthusiasts, 
                providing insights into social history, textile technology, and cultural expression. The garments 
                document not only changing styles but also the economic, social, and cultural forces that shaped 
                American fashion throughout the 20th century.
              </p>
            </div>
          </section>

          {/* Photogrammetry and 3D Capture */}
          <section className="space-y-4 border-t border-zinc-800 pt-8 md:pt-12">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight text-zinc-100">
              Photogrammetry and 3D Capture
            </h2>
            <div className="space-y-4 text-zinc-300 font-light leading-relaxed">
              <p>
                This project leverages advanced photogrammetry techniques to create detailed 3D models of historic 
                garments. Photogrammetry—the science of making measurements from photographs—allows us to capture 
                the three-dimensional form, texture, and details of each piece with remarkable precision.
              </p>
              <p>
                By photographing each garment from multiple angles and processing these images through specialized 
                software, we create digital models that preserve not just the visual appearance but the physical 
                structure of these historic textiles. These 3D models enable virtual exploration that goes far beyond 
                traditional photography, allowing users to rotate, zoom, and examine garments from every angle.
              </p>
              <p>
                This approach opens new possibilities for preservation, research, and public engagement. Fragile garments 
                can be studied in detail without physical handling, and the collection becomes accessible to audiences 
                worldwide, transcending the limitations of physical museum space.
              </p>
            </div>
          </section>

          {/* Technology and Future */}
          <section className="space-y-4 border-t border-zinc-800 pt-8 md:pt-12">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight text-zinc-100">
              Looking Forward
            </h2>
            <div className="space-y-4 text-zinc-300 font-light leading-relaxed">
              <p>
                As this project evolves, we plan to integrate additional features and connect to museum collection 
                management systems like CollectiveAccess. This will enable seamless updates from our archival database 
                and provide even richer metadata and provenance information.
              </p>
              <p>
                Our goal is to create a living archive that grows with the collection, continuously expanding our 
                understanding of these garments through ongoing research, new acquisitions, and community engagement. 
                We invite you to explore, discover, and connect with the stories woven into every thread of these 
                historic garments.
              </p>
            </div>
          </section>

          {/* Contact/Additional Info */}
          <section className="border-t border-zinc-800 pt-8 md:pt-12 mt-12">
            <div className="text-sm text-zinc-400 font-light space-y-2">
              <p>
                For more information about the UVA Historic Clothing Collection, please contact the collection 
                curators through the University of Virginia's special collections department.
              </p>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}

