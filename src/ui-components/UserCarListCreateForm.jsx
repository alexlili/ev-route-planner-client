/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import { Button, Flex, Grid, TextField } from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { generateClient } from "aws-amplify/api";
import { createUserCarList } from "../graphql/mutations";
const client = generateClient();
export default function UserCarListCreateForm(props) {
  const {
    clearOnSuccess = true,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    portType: "",
    brand: "",
    range: "",
    name: "",
  };
  const [portType, setPortType] = React.useState(initialValues.portType);
  const [brand, setBrand] = React.useState(initialValues.brand);
  const [range, setRange] = React.useState(initialValues.range);
  const [name, setName] = React.useState(initialValues.name);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setPortType(initialValues.portType);
    setBrand(initialValues.brand);
    setRange(initialValues.range);
    setName(initialValues.name);
    setErrors({});
  };
  const validations = {
    portType: [],
    brand: [],
    range: [],
    name: [],
  };
  const runValidationTasks = async (
    fieldName,
    currentValue,
    getDisplayValue
  ) => {
    const value =
      currentValue && getDisplayValue
        ? getDisplayValue(currentValue)
        : currentValue;
    let validationResponse = validateField(value, validations[fieldName]);
    const customValidator = fetchByPath(onValidate, fieldName);
    if (customValidator) {
      validationResponse = await customValidator(value, validationResponse);
    }
    setErrors((errors) => ({ ...errors, [fieldName]: validationResponse }));
    return validationResponse;
  };
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
      onSubmit={async (event) => {
        event.preventDefault();
        let modelFields = {
          portType,
          brand,
          range,
          name,
        };
        const validationResponses = await Promise.all(
          Object.keys(validations).reduce((promises, fieldName) => {
            if (Array.isArray(modelFields[fieldName])) {
              promises.push(
                ...modelFields[fieldName].map((item) =>
                  runValidationTasks(fieldName, item)
                )
              );
              return promises;
            }
            promises.push(
              runValidationTasks(fieldName, modelFields[fieldName])
            );
            return promises;
          }, [])
        );
        if (validationResponses.some((r) => r.hasError)) {
          return;
        }
        if (onSubmit) {
          modelFields = onSubmit(modelFields);
        }
        try {
          Object.entries(modelFields).forEach(([key, value]) => {
            if (typeof value === "string" && value === "") {
              modelFields[key] = null;
            }
          });
          await client.graphql({
            query: createUserCarList.replaceAll("__typename", ""),
            variables: {
              input: {
                ...modelFields,
              },
            },
          });
          if (onSuccess) {
            onSuccess(modelFields);
          }
          if (clearOnSuccess) {
            resetStateValues();
          }
        } catch (err) {
          if (onError) {
            const messages = err.errors.map((e) => e.message).join("\n");
            onError(modelFields, messages);
          }
        }
      }}
      {...getOverrideProps(overrides, "UserCarListCreateForm")}
      {...rest}
    >
      <TextField
        label="Port type"
        isRequired={false}
        isReadOnly={false}
        value={portType}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              portType: value,
              brand,
              range,
              name,
            };
            const result = onChange(modelFields);
            value = result?.portType ?? value;
          }
          if (errors.portType?.hasError) {
            runValidationTasks("portType", value);
          }
          setPortType(value);
        }}
        onBlur={() => runValidationTasks("portType", portType)}
        errorMessage={errors.portType?.errorMessage}
        hasError={errors.portType?.hasError}
        {...getOverrideProps(overrides, "portType")}
      ></TextField>
      <TextField
        label="Brand"
        isRequired={false}
        isReadOnly={false}
        value={brand}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              portType,
              brand: value,
              range,
              name,
            };
            const result = onChange(modelFields);
            value = result?.brand ?? value;
          }
          if (errors.brand?.hasError) {
            runValidationTasks("brand", value);
          }
          setBrand(value);
        }}
        onBlur={() => runValidationTasks("brand", brand)}
        errorMessage={errors.brand?.errorMessage}
        hasError={errors.brand?.hasError}
        {...getOverrideProps(overrides, "brand")}
      ></TextField>
      <TextField
        label="Range"
        isRequired={false}
        isReadOnly={false}
        value={range}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              portType,
              brand,
              range: value,
              name,
            };
            const result = onChange(modelFields);
            value = result?.range ?? value;
          }
          if (errors.range?.hasError) {
            runValidationTasks("range", value);
          }
          setRange(value);
        }}
        onBlur={() => runValidationTasks("range", range)}
        errorMessage={errors.range?.errorMessage}
        hasError={errors.range?.hasError}
        {...getOverrideProps(overrides, "range")}
      ></TextField>
      <TextField
        label="Name"
        isRequired={false}
        isReadOnly={false}
        value={name}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              portType,
              brand,
              range,
              name: value,
            };
            const result = onChange(modelFields);
            value = result?.name ?? value;
          }
          if (errors.name?.hasError) {
            runValidationTasks("name", value);
          }
          setName(value);
        }}
        onBlur={() => runValidationTasks("name", name)}
        errorMessage={errors.name?.errorMessage}
        hasError={errors.name?.hasError}
        {...getOverrideProps(overrides, "name")}
      ></TextField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Clear"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          {...getOverrideProps(overrides, "ClearButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={Object.values(errors).some((e) => e?.hasError)}
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
