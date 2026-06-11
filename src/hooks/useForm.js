import { useState } from "react";

export function useForm(initialValues, validate) {
  const [values,  setValues]  = useState(initialValues);
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((p) => ({ ...p, [name]: value }));
    if (touched[name] && validate) {
      const errs = validate({ ...values, [name]: value });
      setErrors((p) => ({ ...p, [name]: errs[name] || "" }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    if (validate) {
      const errs = validate(values);
      setErrors((p) => ({ ...p, [name]: errs[name] || "" }));
    }
  };

  const validateAll = () => {
    if (!validate) return true;
    const errs = validate(values);
    setErrors(errs);
    setTouched(Object.keys(values).reduce((a, k) => ({ ...a, [k]: true }), {}));
    return Object.keys(errs).length === 0;
  };

  const reset = () => { setValues(initialValues); setErrors({}); setTouched({}); };

  return { values, errors, touched, handleChange, handleBlur, validateAll, reset, setValues };
}