import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createProduct,
  getProductById,
  updateProduct,
} from "../../services/products/products.service";
import { uploadImage } from "../../services/upload/upload.service";

// TYPES
type ProductFormFields = {
  name: string;
  price: number | "";
  description: string;
  category: string | "";
  stock: number | "";
  imageUrl: string;
};

type ProductFormErrors = {
  name?: string;
  price?: string;
  category?: string;
  stock?: string;
};

type ProductFormState = {
  fields: ProductFormFields;
  errors: ProductFormErrors;
  status: "editing" | "submitting" | "success" | "error";
  globalError: string | null;
};

//* VALIDATIONS
const validateFields = (fields: ProductFormFields): ProductFormErrors => {
  const errors: ProductFormErrors = {};

  if (!fields.name.trim()) {
    errors.name = "Name is required";
  }

  if (fields.price === "" || Number(fields.price) <= 0) {
    errors.price = "Price must be greater than 0";
  }

  if (!fields.category) {
    errors.category = "Category is required";
  }

  if (fields.stock === "" || Number(fields.stock) < 0) {
    errors.stock = "Stock cannot be negative";
  }

  return errors;
};

// INITIAL STATE
const initialState: ProductFormState = {
  fields: {
    name: "",
    price: "",
    description: "",
    category: "",
    stock: "",
    imageUrl: "",
  },
  errors: {},
  status: "editing",
  globalError: null,
};

//* COMPONENT
export const ProductFormPage = () => {
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const [state, setState] = useState(initialState);

  //* EDIT MODE PREFILL
  useEffect(() => {
    if (!productId) {
      return;
    }
    const fetchProduct = async () => {
      try {
        const product = await getProductById(productId);
        if (!product) {
          return;
        }
        setState((prev) => ({
          ...prev,
          fields: {
            name: product.name,
            price: product.price,
            description: product.description,
            category: product.category,
            stock: product.stock,
            imageUrl: product.imageUrl,
          },
        }));
      } catch (error) {
        console.error(error);
      }
    };
    fetchProduct();
  }, [productId]);

  //* FILE STATES & HANDLE FILE CHANGE
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setSelectedFile(file);

    //* URL.createObjectURL(file): Solo genera:
    //* blob:http://localhost...: Para previsualizacion
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
  };

  //* CLEAN UP: Eliminamos imagen de preview
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  //* HANDLE CHANGE
  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;
    const updatedFields = {
      ...state.fields,
      [name]:
        name === "price" || name === "stock"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    };
    const updatedErrors = validateFields(updatedFields);
    setState((prev) => ({
      ...prev,
      fields: updatedFields,
      errors: updatedErrors,
    }));
  };

  //* HANDLE SUBMIT
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    //* 1. VALIDAR CAMPOS
    const errors = validateFields(state.fields);
    if (Object.keys(errors).length > 0) {
      setState((prev) => ({
        ...prev,
        errors,
      }));
      return;
    }

    //* 2. ESTADO SUBMITTING
    setState((prev) => ({
      ...prev,
      status: "submitting",
      globalError: null,
    }));

    try {
      //* 3. CONSERVAR IMAGE URL EXISTENTE
      let finalImageUrl = state.fields.imageUrl;

      //* 4. SI HAY NUEVA IMAGEN → SUBIR A S3:
      if (selectedFile) {
        finalImageUrl = await uploadImage(selectedFile);
      }

      //* 5. PAYLOAD FINAL
      const productData = {
        ...state.fields,
        imageUrl: finalImageUrl,
      };

      //* 6. CREATE O UPDATE
      if (productId) {
        await updateProduct(productId, productData as any);
      } else {
        await createProduct(productData as any);
      }

      //* 7. SUCCESS
      setState((prev) => ({
        ...prev,
        status: "success",
      }));
      navigate("/admin/products");
    } catch (error) {
      console.error(error);

      //* 8. ERROR HANDLING
      let message = "Could not save product";
      if (error instanceof Error) {
        if (error.message.includes("permission-denied")) {
          message = "You do not have permission to perform this action";
        }

        if (error.message.includes("CORS")) {
          message = "CORS error while uploading image";
        }
      }

      setState((prev) => ({
        ...prev,
        status: "error",
        globalError: message,
      }));
    }
  };

  //* RENDER

  return (
    <div>
      <h1>{productId ? "Edit Product" : "Create Product"}</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxWidth: "400px",
          marginTop: "1rem",
        }}
      >
        {/* NAME */}
        <div>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={state.fields.name}
            onChange={handleChange}
          />
          {state.errors.name && <p>{state.errors.name}</p>}
        </div>

        {/* PRICE */}
        <div>
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={state.fields.price}
            onChange={handleChange}
          />
          {state.errors.price && <p>{state.errors.price}</p>}
        </div>

        {/* DESCRIPTION */}
        <div>
          <textarea
            name="description"
            placeholder="Description"
            value={state.fields.description}
            onChange={handleChange}
          />
        </div>

        {/* CATEGORY */}
        <div>
          <select
            name="category"
            value={state.fields.category}
            onChange={handleChange}
          >
            <option value="">Select category</option>
            <option value="books">Books</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
          </select>
          {state.errors.category && <p>{state.errors.category}</p>}
        </div>

        {/* STOCK */}
        <div>
          <input
            type="number"
            name="stock"
            placeholder="Stock"
            value={state.fields.stock}
            onChange={handleChange}
          />
          {state.errors.stock && <p>{state.errors.stock}</p>}
        </div>

        {/* IMAGE UPLOAD */}
        <div>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>
        {/* IMAGE PREVIEW */}
        {/* Seleccionada ó preexistente */}
        {(previewUrl || state.fields.imageUrl) && (
          <img
            src={previewUrl || state.fields.imageUrl}
            alt="Preview"
            style={{
              width: "200px",
              borderRadius: "8px",
            }}
          />
        )}

        {/* GLOBAL ERROR */}
        {state.globalError && <p>{state.globalError}</p>}
        
        <button type="submit" disabled={state.status === "submitting"}>
          {state.status === "submitting" ? "Saving..." : "Save Product"}
        </button>
      </form>
    </div>
  );
};
