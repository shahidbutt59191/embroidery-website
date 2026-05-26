"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PropertyManager({ gigId, initialProperties }: { gigId: string, initialProperties: any[] }) {
  const [properties, setProperties] = useState(initialProperties);
  const [showAddProp, setShowAddProp] = useState(false);
  const [newProp, setNewProp] = useState({ name: "", type: "select", required: true });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Option state
  const [addingOptionTo, setAddingOptionTo] = useState<string | null>(null);
  const [newOption, setNewOption] = useState({ value: "", priceModifier: "0" });

  const handleAddProperty = async () => {
    if (!newProp.name.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("gig_properties")
      .insert([
        {
          gig_id: gigId,
          property_name: newProp.name,
          field_type: newProp.type,
          is_required: newProp.required,
          sort_order: properties.length,
        }
      ])
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
    await supabase.from("gig_properties").delete().eq("id", propId);
    setProperties(properties.filter(p => p.id !== propId));
    router.refresh();
  };

  const handleAddOption = async (propId: string) => {
    if (!newOption.value.trim()) return;
    
    const { data, error } = await supabase
      .from("gig_property_options")
      .insert([
        {
          property_id: propId,
          option_value: newOption.value,
          price_modifier: parseFloat(newOption.priceModifier) || 0,
        }
      ])
      .select()
      .single();

    if (!error && data) {
      setProperties(properties.map(p => {
        if (p.id === propId) {
          return { ...p, gig_property_options: [...(p.gig_property_options || []), data] };
        }
        return p;
      }));
      setAddingOptionTo(null);
      setNewOption({ value: "", priceModifier: "0" });
      router.refresh();
    }
  };

  const handleDeleteOption = async (propId: string, optionId: string) => {
    await supabase.from("gig_property_options").delete().eq("id", optionId);
    setProperties(properties.map(p => {
      if (p.id === propId) {
        return { ...p, gig_property_options: p.gig_property_options.filter((o: any) => o.id !== optionId) };
      }
      return p;
    }));
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* List Properties */}
      {properties.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-accent/20 rounded-xl border border-dashed border-border">
          No properties added yet. Add formats, sizes, or fabrics!
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((prop) => (
            <div key={prop.id} className="border border-border rounded-xl p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{prop.property_name}</h3>
                  <div className="flex gap-2 mt-1 text-sm text-muted-foreground">
                    <span className="bg-accent/50 px-2 py-0.5 rounded text-xs uppercase">{prop.field_type}</span>
                    {prop.is_required && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs">Required</span>}
                  </div>
                </div>
                <button onClick={() => handleDeleteProperty(prop.id)} className="text-red-400 hover:text-red-600 transition-colors p-2 bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Options Section */}
              {['select', 'radio', 'checkbox'].includes(prop.field_type) && (
                <div className="pl-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Options:</h4>
                  <ul className="space-y-2 mb-3">
                    {prop.gig_property_options?.map((opt: any) => (
                      <li key={opt.id} className="flex justify-between items-center text-sm bg-accent/20 p-2 rounded-lg border border-border">
                        <span>{opt.option_value}</span>
                        <div className="flex items-center gap-4">
                          <span className={opt.price_modifier > 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                            {opt.price_modifier > 0 ? `+$${opt.price_modifier}` : "Free"}
                          </span>
                          <button onClick={() => handleDeleteOption(prop.id, opt.id)} className="text-muted-foreground hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Add Option Form */}
                  {addingOptionTo === prop.id ? (
                    <div className="flex gap-2 items-center bg-accent/20 p-2 rounded-lg">
                      <input 
                        type="text" 
                        placeholder="Option Name (e.g. DST)" 
                        className="flex-1 text-sm p-2 rounded-md border border-border focus:outline-none"
                        value={newOption.value}
                        onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                      />
                      <div className="flex items-center gap-1 bg-white border border-border rounded-md px-2">
                        <span className="text-muted-foreground text-sm">$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          className="w-16 text-sm py-2 focus:outline-none"
                          value={newOption.priceModifier}
                          onChange={(e) => setNewOption({ ...newOption, priceModifier: e.target.value })}
                        />
                      </div>
                      <button onClick={() => handleAddOption(prop.id)} className="bg-primary text-white p-2 rounded-md hover:bg-primary/90">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setAddingOptionTo(null)} className="bg-gray-200 text-gray-700 p-2 rounded-md hover:bg-gray-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setAddingOptionTo(prop.id)}
                      className="text-sm text-secondary font-medium flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Add Option
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Property Button / Form */}
      {showAddProp ? (
        <div className="bg-accent/20 p-5 rounded-xl border border-border space-y-4">
          <h3 className="font-semibold text-foreground">Add New Property</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Property Name</label>
              <input 
                type="text" 
                placeholder="e.g. Fabric Type" 
                className="w-full text-sm p-2 rounded-lg border border-border focus:outline-none"
                value={newProp.name}
                onChange={(e) => setNewProp({ ...newProp, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Field Type</label>
              <select 
                className="w-full text-sm p-2 rounded-lg border border-border focus:outline-none"
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
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="req" 
              checked={newProp.required}
              onChange={(e) => setNewProp({ ...newProp, required: e.target.checked })}
            />
            <label htmlFor="req" className="text-sm font-medium">Customer must answer this</label>
          </div>
          <div className="flex gap-2 pt-2">
            <button 
              onClick={handleAddProperty}
              disabled={loading}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Save Property
            </button>
            <button 
              onClick={() => setShowAddProp(false)}
              className="bg-white border border-border text-foreground px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowAddProp(true)}
          className="w-full py-3 border-2 border-dashed border-secondary/50 rounded-xl text-secondary font-medium flex justify-center items-center gap-2 hover:bg-secondary/5 transition-colors"
        >
          <Plus className="w-5 h-5" /> Add Custom Property
        </button>
      )}
    </div>
  );
}
