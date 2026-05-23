export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Our Story</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            For over 20 years, we've been crafting premium kitchenware that brings joy to home cooking. 
            Our passion is creating tools that inspire culinary creativity and last for generations.
          </p>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <img
              src="https://readdy.ai/api/search-image?query=Professional%20kitchen%20workshop%20with%20craftspeople%20making%20premium%20cookware%20showing%20attention%20to%20detail%20and%20quality%20craftsmanship%20in%20bright%20modern%20facility&width=800&height=600&seq=about1&orientation=landscape"
              alt="Our Workshop"
              className="rounded-lg shadow-lg"
            />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Crafted with Care</h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Every piece in our collection is thoughtfully designed and rigorously tested by professional chefs. 
                We use only the finest materials and time-honored manufacturing techniques to ensure exceptional quality.
              </p>
              <p className="text-gray-700 leading-relaxed">
                From our tri-ply stainless steel to our hand-finished wooden handles, every detail matters. 
                We believe great cookware should perform beautifully and last a lifetime.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#B87333]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-award-line text-3xl text-[#B87333] w-8 h-8 flex items-center justify-center"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Quality First</h3>
              <p className="text-gray-600">
                We never compromise on quality. Every product meets our rigorous standards before reaching your kitchen.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#B87333]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-earth-line text-3xl text-[#B87333] w-8 h-8 flex items-center justify-center"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sustainability</h3>
              <p className="text-gray-600">
                We're committed to sustainable practices and materials that are better for you and the planet.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#B87333]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-customer-service-line text-3xl text-[#B87333] w-8 h-8 flex items-center justify-center"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customer Care</h3>
              <p className="text-gray-600">
                Your satisfaction is our priority. We're here to support you with lifetime warranties and expert advice.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
