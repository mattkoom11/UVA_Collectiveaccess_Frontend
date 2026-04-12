import PageLayout from "@/components/layout/PageLayout";

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Page Header */}
        <div className="mb-12 md:mb-16 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4 text-archive-fg">
            About UVA Fashion
          </h1>
          <p className="text-sm md:text-base text-archive-muted font-light max-w-[min(42rem,70ch)] mx-auto leading-[1.7]">
            Exploring the intersection of fashion history, digital preservation, and cultural heritage
          </p>
        </div>

        {/* Main Content — comfortable measure for long reading */}
        <div className="prose-measure mx-auto space-y-10 md:space-y-14">
          {/* UVA Fashion Project */}
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight text-archive-fg">
              The UVA Fashion Project
            </h2>
            <div className="space-y-4 text-archive-muted font-light leading-[1.7]">
              <p>
                UVA Fashion is a digital exploration of the University of Virginia&apos;s historic clothing collection,
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

          {/* Ornament Divider */}
          <div className="flex items-center justify-center gap-3 py-10 md:py-14">
            <div className="h-px w-12 bg-archive-border" />
            <div className="w-1 h-1 rounded-full bg-archive-border" />
            <div className="h-px w-12 bg-archive-border" />
          </div>

          {/* Historic Clothing Collection */}
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight text-archive-fg">
              The Historic Clothing Collection
            </h2>
            <div className="space-y-4 text-archive-muted font-light leading-[1.7]">
              <p>
                The University of Virginia&apos;s Historic Clothing Collection preserves garments spanning several centuries
                of American and non-American fashion history. From elegant evening gowns of the 1920s to structured suits of the 1950s,
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

          {/* Ornament Divider */}
          <div className="flex items-center justify-center gap-3 py-10 md:py-14">
            <div className="h-px w-12 bg-archive-border" />
            <div className="w-1 h-1 rounded-full bg-archive-border" />
            <div className="h-px w-12 bg-archive-border" />
          </div>

          {/* Photogrammetry and 3D Capture */}
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight text-archive-fg">
              Photogrammetry and 3D Capture
            </h2>
            <div className="space-y-4 text-archive-muted font-light leading-[1.7]">
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

          {/* Ornament Divider */}
          <div className="flex items-center justify-center gap-3 py-10 md:py-14">
            <div className="h-px w-12 bg-archive-border" />
            <div className="w-1 h-1 rounded-full bg-archive-border" />
            <div className="h-px w-12 bg-archive-border" />
          </div>

          {/* Technology and Future */}
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight text-archive-fg">
              Looking Forward
            </h2>
            <div className="space-y-4 text-archive-muted font-light leading-[1.7]">
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

          {/* Ornament Divider */}
          <div className="flex items-center justify-center gap-3 py-10 md:py-14">
            <div className="h-px w-12 bg-archive-border" />
            <div className="w-1 h-1 rounded-full bg-archive-border" />
            <div className="h-px w-12 bg-archive-border" />
          </div>

          {/* Contact/Additional Info */}
          <aside className="bg-archive-surface border border-archive-border px-6 py-5">
            <p className="text-xs uppercase tracking-[0.2em] text-archive-muted mb-3">Get in Touch</p>
            <p className="text-sm text-archive-muted font-light leading-[1.7]">
              For more information about the UVA Historic Clothing Collection, please contact the collection
              curators through the University of Virginia&apos;s special collections department.
            </p>
          </aside>
        </div>
      </div>
    </PageLayout>
  );
}
