# Component inventory

| Layer | Component | Wave 2 state | Accessibility contract |
|---|---|---|---|
| Foundation | tokens, focus, density, tenant resolver | Canonical | semantic roles, reduced motion, coarse-pointer target |
| Primitive | Button, IconButton | Hardened + legacy variant adapter | native button, busy/disabled/name/focus |
| Primitive | Input, Textarea, Select | Hardened | native control, invalid/busy/read-only/disabled |
| Primitive | Checkbox, Radio, Switch | Added | native choice or named switch, keyboard state |
| Composite | Field/FormField | Hardened + alias | label/help/error IDs, required and live error |
| Composite | Modal, ConfirmDialog, Drawer/Sheet foundation | Hardened | label, trap, initial/restore focus, Escape, scroll containment |
| Primitive | Status/StatusBadge | Hardened + adapter | registry tone plus icon/text; status role |
| Composite | Breadcrumb, Tabs, SegmentedControl | Added | native nav/radio and APG tab keys |
| Composite | PageHeader, FilterBar | Hardened/added | canonical heading and labelled filter region |
| Composite | DataTable | Hardened | semantic table/caption, keyboard sort/rows, loading/empty/error, pagination/mobile renderer |
| Development | DesignSystemCatalog | Added, unreferenced by production | state matrix harness without runtime package |

Combobox was not added because current controlled Students consumers do not require searchable value selection. Sheet is represented by the hardened Drawer contract. Specialized ScoreEntryGrid and all future catalog items remain out of scope.

