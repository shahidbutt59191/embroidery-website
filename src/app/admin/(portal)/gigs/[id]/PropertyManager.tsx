"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PropertyManager({ gigId, initialProperties }: { gigId: string, initialProperties: any[] }) {
  const [properties, setProperties] = useState(initialProperties);
  const [showAddProp, setShowAddProp] = useState(false);
  const [newProp, setNewProp] = useState({ name: "", type: "select", required: true });
  const [loading, setLoading] = useState(false);
  const [addingOptionTo, setAddingOptionTo] = useState<string | null>(null);
  const [newOption, setNewOption] = useState({ value: "", priceModifier: "0" });
  const supabase = createClient();
  const router = useRouter();

  const handleAddProperty = async () => {
    if (!newProp.name.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("gig_properties")
      .insert([{
        gig_id: gigId,
        property_name: newProp.name,
        field_type: newProp.type,
        is_required: newProp.required,
        sort_order: properties.length,
      }])
      .select('*, gig_property_options(*)')
      .single();

    if (!error && data) {
      setProperties([...properties, data]);
      setShowAddProp(false);
      setNewProp({ name: "", type: "select", required: true });
      router.refresh();
    }
    setLoading(false);
  };

  const handleDeleteProperty = async (propId: string) => {
    if (!confirm("Delete this property and all its options?")) return;
    await supabase.from("gig_properties").delete().eq("id", propId);
    setProperties(properties.filter(p => p.id !== propId));
    router.refresh();
  };

  const handleAddOption = async (propId: string) => {
    if (!newOption.value.trim()) return;
    const { data, error } = await supabase
      .from("gig_property_options")
      .insert([{
        property_id: propId,
        option_value: newOption.value,
        price_modifier: parseFloat(newOption.priceModifier) || 0,
      }])
      .select()
      .single();

    if (!error && data) {
      setProperties(properties.map(p =>
        p.id === propId ? { ...p, gig_property_options: [...(p.gig_property_options || []), data] } : p
      ));
      setAddingOptionTo(null);
      setNewOption({ value: "", priceModifier: "0" });
      router.refresh();
    }
  };

  const handleDeleteOption = async (propId: string, optionId: string) => {
    await supabase.from("gig_property_options").delete().eq("id", optionId);
    setProperties(properties.map(p =>
      p.id === propId
        ? { ...p, gig_property_options: p.gig_property_options.filter((o: any) => o.id !== optionId) }
        : p
    ));
  };

  return (
    <div className="space-y-4">
      {properties.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground bg-accent/20 rounded-xl border border-dashed border-border">
          <p className="font-medium">No properties yet.</p>
          <p className="text-sm mt-1">Add format options, sizes, fabric types, etc.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((prop) => (
            <div key={prop.id} className="border border-border rounded-xl p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3 pb-3 border-b border-border">
                <div>
                  <h3 className="font-semibold text-foreground">{prop.property_name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="bg-white border border-border px-2 py-0.5 rounded text-xs text-muted-foreground uppercase">{prop.field_type}</span>
                    {prop.is_required && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-medium">Required</span>}
                  </div>
                </div>
                <button onClick={() => handleDeleteProperty(prop.id)} className="text-red-400 hover:text-red-600 p-1.5 bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {['select', 'radio', 'checkbox'].includes(prop.field_type) && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Options</p>
                  <ul className="space-y-1.5">
                    {prop.gig_property_options?.map((opt: any) => (
                      <li key={opt.id} className="flex justify-between items-center text-sm bg-white p-2.5 rounded-lg border border-border">
                        <span className="font-medium">{opt.option_value}</span>
                        <div className="flex items-center gap-3">
                          <span className={opt.price_modifier > 0 ? "text-green-600 font-semibold text-xs" : "text-muted-foreground text-xs"}>
                            {opt.price_modifier > 0 ? `+$${opt.price_modifier}` : "Included"}
                          </span>
                          <button onClick={() => handleDeleteOption(prop.id, opt.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {addingOptionTo === prop.id ? (
                    <div className="flex gap-2 items-center bg-white p-2 rounded-lg border border-border">
                      <input
                        type="text"
                        placeholder="Option name (e.g. DST)"
                        className="flex-1 text-sm p-1.5 focus:outline-none"
                        value={newOption.value}
                        onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddOption(prop.id)}
                        autoFocus
                      />
                      <div className="flex items-center gap-1 bg-gray-50 border border-border rounded px-2">
                        <span className="text-muted-foreground text-xs">+$</span>
                        <input
                          type="number" step="0.01" placeholder="0"
                          className="w-14 text-sm py-1 focus:outline-none bg-transparent"
                          value={newOption.priceModifier}
                          onChange={(e) => setNewOption({ ...newOption, priceModifier: e.target.value })}
                        />
                      </div>
                      <button onClick={() => handleAddOption(prop.id)} className="bg-primary text-white p-1.5 rounded-lg hover:bg-primary/90">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setAddingOptionTo(null)} className="bg-gray-100 text-gray-600 p-1.5 rounded-lg hover:bg-gray-200">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingOptionTo(prop.id)} className="text-sm text-secondary font-medium flex items-center gap-1 hover:underline mt-1">
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddProp ? (
        <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 space-y-4">
          <h3 className="font-semibold text-foreground">New Property</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Property Name</label>
              <input
                type="text" placeholder="e.g. File Format"
                className="w-full text-sm p-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                value={newProp.name}
                onChange={(e) => setNewProp({ ...newProp, name: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Field Type</label>
              <select
                className="w-full text-sm p-2.5 rounded-lg border border-border focus:outline-none bg-white"
                value={newProp.type}
                onChange={(e) => setNewProp({ ...newProp, type: e.target.value })}
              >
                <option value="select">Dropdown (Select)</option>
                <option value="radio">Radio Buttons</option>
                <option value="checkbox">Checkboxes</option>
                <option value="text">Text Input</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox" checked={newProp.required}
              onChange={(e) => setNewProp({ ...newProp, required: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm font-medium text-foreground">Customer must fill this in</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleAddProperty} disabled={loading}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Save Property
            </button>
            <button onClick={() => setShowAddProp(false)} className="bg-white border border-border text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent/50">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddProp(true)}
          className="w-full py-3 border-2 border-dashed border-secondary/40 rounded-xl text-secondary font-medium flex justify-center items-center gap-2 hover:bg-secondary/5 hover:border-secondary transition-colors"
        >
          <Plus className="w-5 h-5" /> Add Custom Property
        </button>
      )}
    </div>
  );
}
