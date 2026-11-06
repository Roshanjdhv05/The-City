import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
const Q: [string, string][] = [
  ['How do I claim a plot?', 'Open the marketplace, pick an available plot on the map or in the list, choose a starting template and press Claim. You then continue in the editor.'],
  ['Can I rent a plot?', 'Plots are priced per month. Billing is not connected in this build, so claiming is instant; connect a payment provider in purchasePlot() before charging.'],
  ['How does store customization work?', 'Choose a template or switch to Modular mode. Changes show in a live 3D preview and are saved to your account when you press Save Store.'],
  ['Can I link my existing website?', 'Yes. Add your website URL in the editor. Visitors open it only when they press Enter Store in the store panel.'],
  ['What do plot states mean?', 'Available plots can be claimed. Occupied plots have a building. Reserved plots are held by the city and cannot be claimed. Premium, featured and corner plots are higher-visibility locations.'],
  ['The city runs slowly. What can I do?', 'Open the quality menu and choose Low or Medium. Low turns off real-time shadows, post-processing and interiors, and is chosen automatically on phones.'],
];
export default function FAQ() {
  return (
    <div className="page light"><Nav />
      <div className="wrap narrow-text"><span className="eyebrow" style={{ color: '#0e7490' }}>Help</span><h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.4rem)' }}>Frequently asked questions</h1>
        {Q.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
      </div>
      <Footer />
    </div>
  );
}
